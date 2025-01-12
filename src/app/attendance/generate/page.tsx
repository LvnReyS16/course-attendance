'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SupabaseClient } from '@supabase/supabase-js';
import moment from 'moment';

interface Section {
  id: string;
  name: string;
  course_id: string;
  course: {
    code: string;
    title: string;
  };
}

const checkAndUpdateSessionStatus = async (supabase: SupabaseClient, sessionId: string) => {
  const { data: session } = await supabase
    .from('attendance_sessions')
    .select('expires_at, status')
    .eq('id', sessionId)
    .single();

  if (session && new Date(session.expires_at) < new Date() && session.status === 'active') {
    // Update session status to expired
    await supabase
      .from('attendance_sessions')
      .update({ status: 'expired' })
      .eq('id', sessionId);
    return false;
  }
  return session?.status === 'active';
};

export default function GenerateQRPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');
  const supabase = createClientComponentClient();


  const generateSession = async () => {
    if (!selectedSection) return;
    
    setIsGenerating(true);
    try {
      const expiresAt = moment().add(15, 'minutes').toISOString();

      const section = sections.find(s => s.name === selectedSection);
      
      const sessionData = {
        section_id: section?.id,
        course_id: section?.course_id,
        date: moment().format('YYYY-MM-DD'),
        expires_at: expiresAt,
        status: 'active'
      };

      const { data, error } = await supabase
        .from('attendance_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) {
        setError('Failed to create session');
        console.error('Error creating session:', error);
        return;
      }
      setSessionId(data.id);
      setError('');
    } finally {
      setIsGenerating(false);
    }
  };

  const qrValue = sessionId 
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/attendance/${selectedSection}/${sessionId}`
    : '';

  useEffect(() => {
    if (sessionId) {
      const interval = setInterval(async () => {
        const isActive = await checkAndUpdateSessionStatus(supabase, sessionId);
        if (!isActive) {
          setSessionId('');
          setError('Session expired');
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [sessionId, supabase]);

  useEffect(() => {
    async function fetchSections() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('sections')
          .select(`
            id,
            name,
            course_id,
            course:courses (
              code,
              title
            )
          `);

        if (!error && data) {
          setSections(data as unknown as Section[]);
        } else if (error) {
          setError('Error fetching sections');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchSections();
  }, [supabase]);


  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Generate Attendance QR Code
        </h1>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Section
          </label>
          {isLoading ? (
            <div className="w-full p-2 border rounded-lg bg-gray-50 text-gray-500">
              Loading sections...
            </div>
          ) : (
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Select a section...</option>
              {sections?.map((section) => (
                <option key={section.id} value={section.name}>
                  {section.name} - {section.course?.code || 'No course'}
                </option>
              ))}
            </select>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={generateSession}
          disabled={!selectedSection || isGenerating}
          className="w-full mb-8 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate New Session'}
        </button>

        {sessionId && (
          <div className="text-center">
            <div className="bg-white p-4 inline-block rounded-lg shadow-lg">
              <QRCodeSVG value={qrValue} size={256} />
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Session ID: {sessionId}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Section: {sections.find(s => s.name === selectedSection)?.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
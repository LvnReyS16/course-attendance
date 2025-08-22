'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import StudentSearch from '@/components/StudentSearch';
import moment from 'moment';

interface Section {
  id: string;
  name: string;
  course: {
    id: string;
    code: string;
    title: string;
  };
}

interface SessionData {
  id: string;
  section_id: string;
  created_at: string;
  section: {
    id: string;
    name: string;
    course: {
      id: string;
      code: string;
      title: string;
    };
  };
}


export default function SectionAttendancePage() {
  const params = useParams();
  const { section, sessionId } = params;
  const [sectionData, setSectionData] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const supabase = createClientComponentClient();
  const currentDate = moment().format('MMMM D, YYYY - dddd');
  const [submitted, setSubmitted] = useState(false);
  const [sessionCreatedAt, setSessionCreatedAt] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function verifySessionAndFetchSection() {
      const { data: sessionData, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select(`
          id,
          section_id,
          expires_at,
          status,
          created_at,
          section:sections (
            id,
            name,
            course:courses!inner (
              id,
              code,
              title
            )
          )
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        setError('Invalid session');
        setLoading(false);
        return;
      }

      const isExpired = moment(sessionData.expires_at, 'YYYY-MM-DD HH:mm:ss').toDate() < new Date();
      if (isExpired && sessionData.status === 'active') {
        await supabase
          .from('attendance_sessions')
          .update({ status: 'expired' })
          .eq('id', sessionId);
        setError('This attendance session has expired');
        setLoading(false);
        return;
      }

      if (sessionData.status === 'expired') {
        setError('This attendance session has expired');
        setLoading(false);
        return;
      }

      const typedSessionData = sessionData as unknown as SessionData;
      if (typedSessionData.section.name !== section) {
        setError('Session-section mismatch');
        setLoading(false);
        return;
      }

      setSectionData({
        id: typedSessionData.section.id,
        name: typedSessionData.section.name,
        course: typedSessionData.section.course
      });
      setSessionCreatedAt(sessionData.created_at);
      setLoading(false);
    }

    if (section && sessionId) {
      verifySessionAndFetchSection();
    }
  }, [section, sessionId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = `/attendance/${section}/${sessionId}`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!sectionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Section Not Found</h2>
          <p className="text-gray-600">The requested section could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-2">
          {sectionData?.course?.code} Attendance
        </h1>
        <p className="text-center text-gray-600 mb-2">
          Section: {sectionData?.name}
        </p>
        <p className="text-center text-gray-600 mb-6">{currentDate}</p>
        
        {submitted ? (
          <div className="text-center text-green-600 font-medium p-4">
            Attendance successfully submitted!
          </div>
        ) : (
          <StudentSearch 
            sectionId={sectionData?.id}
            courseId={sectionData?.course?.id}
            isSubmitting={isSubmitting}
            onSelectStudent={async (student) => {
              try {
                setIsSubmitting(true);
                const currentTime = moment();
                const sessionTime = moment(sessionCreatedAt, 'YYYY-MM-DD HH:mm:ss');
                const timeDiff = currentTime.diff(sessionTime, 'minutes');
                const status = timeDiff <= 15 ? 'present' : 'late';

                const response = await fetch('/api/attendance', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    sessionId,
                    studentId: student.id,
                    sectionId: sectionData?.id,
                    courseId: sectionData?.course?.id,
                    timestamp: new Date().toISOString(),
                    status,
                    verification_method: 'qr'
                  }),
                });

                const result = await response.json();
                if (result.success) {
                  setSubmitted(true);
                  setError('');
                } else {
                  setError(result.error);
                }
              } catch {
                setError('Something went wrong');
              } finally {
                setIsSubmitting(false);
              }
            }} 
          />
        )}

        {error && (
          <div className="mt-4 p-3 text-red-700 bg-red-100 rounded-lg text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 
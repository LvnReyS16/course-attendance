'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';

interface Section {
  id: string;
  name: string;
  course: {
    code: string;
  };
}

interface AttendanceRecord {
  id: string;
  student: {
    id: string;
    name: string;
  };
  section: {
    id: string;
    name: string;
  };
  timestamp: string;
  status: string;
}

export default function AttendanceRecordsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchSections() {
      const { data } = await supabase
        .from('sections')
        .select(`
          id,
          name,
          course:courses (
            code
          )
        `);

      if (data) {
        setSections(data as unknown as Section[]);
      }
      setLoading(false);
    }

    fetchSections();
  }, [supabase]);

  useEffect(() => {
    async function fetchAttendanceRecords() {
      // Convert local date to UTC for comparison
      const startDate = new Date(`${selectedDate}T00:00:00`);
      const endDate = new Date(`${selectedDate}T23:59:59`);

      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          id,
          student:students (
            id,
            name
          ),
          section:sections (
            id,
            name
          ),
          timestamp,
          status
        `)
        .gte('timestamp', startDate.toISOString())
        .lt('timestamp', endDate.toISOString());

      console.log('Query response:', { 
        data, 
        error, 
        selectedDate,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      if (error) {
        console.error('Supabase error:', error);
        return;
      }

      if (data) {
        setRecords(data as unknown as AttendanceRecord[]);
      }
    }

    fetchAttendanceRecords();
  }, [supabase, selectedSection, selectedDate]);

  async function handleDeleteRecord(recordId: string) {
    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', recordId);

    if (error) {
      console.error('Error deleting record:', error);
      return;
    }

    // Update the local state to remove the deleted record
    setRecords(records.filter(record => record.id !== recordId));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Attendance Records</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">All Sections</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name} - {section.course.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Section
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.student.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.section.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(new Date(record.timestamp), 'hh:mm a')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleDeleteRecord(record.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4 mr-1.5" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                        />
                      </svg>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 
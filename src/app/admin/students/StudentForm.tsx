'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';
import LoadingSpinner from '@/components/LoadingSpinner';

interface StudentFormProps {
  studentId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StudentForm({ studentId, onSuccess, onCancel }: StudentFormProps) {
  const supabase = createClientComponentClient<Database>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sections, setSections] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    year_level: 1,
    section_id: '',
    course_id: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        // Fetch sections and courses for dropdowns
        const [sectionsResponse, coursesResponse] = await Promise.all([
          supabase.from('sections').select('id, name, program'),
          supabase.from('courses').select('id, code, title')
        ]);

        if (sectionsResponse.error) throw sectionsResponse.error;
        if (coursesResponse.error) throw coursesResponse.error;

        setSections(sectionsResponse.data || []);
        setCourses(coursesResponse.data || []);

        // If editing, fetch student data
        if (studentId) {
          const { data: student, error } = await supabase
            .from('students')
            .select('*')
            .eq('id', studentId)
            .single();

          if (error) throw error;

          if (student) {
            setFormData({
              name: student.name,
              email: student.email,
              year_level: student.year_level,
              section_id: student.section_id || '',
              course_id: student.course_id || ''
            });
          }
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load form data');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [studentId, supabase]);

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (studentId) {
        // Check if student has attendance records before allowing section/course change
        const { data: attendanceRecords, error: checkError } = await supabase
          .from('attendance_records')
          .select('id')
          .eq('student_id', studentId)
          .limit(1);

        if (checkError) {
          throw new Error(checkError.message);
        }

        // Get current student data
        const { data: currentStudent, error: fetchError } = await supabase
          .from('students')
          .select('section_id, course_id')
          .eq('id', studentId)
          .single();

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        // If student has attendance records and trying to change section or course
        if (attendanceRecords?.length > 0 && 
            (currentStudent?.section_id !== formData.section_id || 
             currentStudent?.course_id !== formData.course_id)) {
          setError('Cannot change section or course for a student with existing attendance records.');
          return;
        }

        // Update existing student
        const { error: updateError } = await supabase
          .from('students')
          .update(formData)
          .eq('id', studentId);

        if (updateError) {
          throw new Error(updateError.message);
        }
      } else {
        // Create new student
        const { error: insertError } = await supabase
          .from('students')
          .insert([{ ...formData, id: crypto.randomUUID() }]);

        if (insertError) {
          throw new Error(insertError.message);
        }
      }

      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while saving the student';
      setError(errorMessage);
      console.error('Error saving student:', err);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          required
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          required
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="year_level" className="block text-sm font-medium text-gray-700">
          Year Level
        </label>
        <select
          id="year_level"
          value={formData.year_level}
          onChange={(e) => setFormData({ ...formData, year_level: parseInt(e.target.value) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {[1, 2, 3, 4].map((year) => (
            <option key={year} value={year}>
              Year {year}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="section" className="block text-sm font-medium text-gray-700">
          Section
        </label>
        <select
          id="section"
          value={formData.section_id}
          onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <option value="">Select a section</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.name} - {section.program}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="course" className="block text-sm font-medium text-gray-700">
          Course
        </label>
        <select
          id="course"
          value={formData.course_id}
          onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <option value="">Select a course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.title}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : studentId ? 'Update' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

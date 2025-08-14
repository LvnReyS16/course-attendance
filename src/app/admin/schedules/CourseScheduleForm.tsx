'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CourseScheduleFormProps {
  scheduleId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const SEMESTERS = [
  'First',
  'Second',
  'Summer'
];

export default function CourseScheduleForm({ scheduleId, onSuccess, onCancel }: CourseScheduleFormProps) {
  const supabase = createClientComponentClient<Database>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [courses, setCourses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    course_id: '',
    section_id: '',
    room_id: '',
    day_of_week: 'Monday',
    start_time: '08:00',
    end_time: '09:00',
    is_lab: false,
    semester: 'First',
    school_year: new Date().getFullYear().toString()
  });

  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        // Fetch all required data in parallel
        const [coursesResponse, sectionsResponse, roomsResponse, scheduleResponse] = await Promise.all([
          supabase.from('courses').select('id, code, title'),
          supabase.from('sections').select('id, name, program'),
          supabase.from('rooms').select('id, room_number, capacity'),
          scheduleId ? supabase.from('course_schedules').select('*').eq('id', scheduleId).single() : null
        ]);

        if (coursesResponse.error) throw coursesResponse.error;
        if (sectionsResponse.error) throw sectionsResponse.error;
        if (roomsResponse.error) throw roomsResponse.error;
        if (scheduleResponse?.error) throw scheduleResponse.error;

        setCourses(coursesResponse.data || []);
        setSections(sectionsResponse.data || []);
        setRooms(roomsResponse.data || []);

        // If editing, populate form with existing data
        if (scheduleResponse?.data) {
          setFormData({
            course_id: scheduleResponse.data.course_id || '',
            section_id: scheduleResponse.data.section_id || '',
            room_id: scheduleResponse.data.room_id || '',
            day_of_week: scheduleResponse.data.day_of_week,
            start_time: scheduleResponse.data.start_time,
            end_time: scheduleResponse.data.end_time,
            is_lab: scheduleResponse.data.is_lab || false,
            semester: scheduleResponse.data.semester,
            school_year: scheduleResponse.data.school_year
          });
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load form data');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [scheduleId, supabase]);

  const validateSchedule = async (scheduleData: typeof formData) => {
    // Check for time conflicts
    const { data: conflicts, error: conflictError } = await supabase
      .from('course_schedules')
      .select('*')
      .eq('day_of_week', scheduleData.day_of_week)
      .eq('room_id', scheduleData.room_id)
      .eq('semester', scheduleData.semester)
      .eq('school_year', scheduleData.school_year)
      .or(`start_time.lte.${scheduleData.end_time},end_time.gte.${scheduleData.start_time}`)
      .neq('id', scheduleId || '');

    if (conflictError) throw conflictError;
    if (conflicts && conflicts.length > 0) {
      throw new Error('This schedule conflicts with an existing schedule in the same room');
    }

    // Validate time range
    const start = new Date(`1970-01-01T${scheduleData.start_time}`);
    const end = new Date(`1970-01-01T${scheduleData.end_time}`);
    if (end <= start) {
      throw new Error('End time must be after start time');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await validateSchedule(formData);

      if (scheduleId) {
        // Update existing schedule
        const { error: updateError } = await supabase
          .from('course_schedules')
          .update(formData)
          .eq('id', scheduleId);

        if (updateError) throw updateError;
      } else {
        // Create new schedule
        const { error: insertError } = await supabase
          .from('course_schedules')
          .insert([{ ...formData, id: crypto.randomUUID() }]);

        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while saving the schedule';
      setError(errorMessage);
      console.error('Error saving schedule:', err);
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
    <form onSubmit={handleSubmit} className="space-y-4">
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
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="course" className="block text-sm font-medium text-gray-700">
            Course
          </label>
          <select
            id="course"
            value={formData.course_id}
            onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
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

        <div>
          <label htmlFor="section" className="block text-sm font-medium text-gray-700">
            Section
          </label>
          <select
            id="section"
            value={formData.section_id}
            onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
            disabled={loading}
          >
            <option value="">Select a section</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name} ({section.program})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="room" className="block text-sm font-medium text-gray-700">
            Room
          </label>
          <select
            id="room"
            value={formData.room_id}
            onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
            disabled={loading}
          >
            <option value="">Select a room</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.room_number} (Capacity: {room.capacity})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="day_of_week" className="block text-sm font-medium text-gray-700">
            Day of Week
          </label>
          <select
            id="day_of_week"
            value={formData.day_of_week}
            onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
            disabled={loading}
          >
            {DAYS_OF_WEEK.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
            Start Time
          </label>
          <input
            type="time"
            id="start_time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
            End Time
          </label>
          <input
            type="time"
            id="end_time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
            Semester
          </label>
          <select
            id="semester"
            value={formData.semester}
            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
            disabled={loading}
          >
            {SEMESTERS.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="school_year" className="block text-sm font-medium text-gray-700">
            School Year
          </label>
          <input
            type="text"
            id="school_year"
            value={formData.school_year}
            onChange={(e) => setFormData({ ...formData, school_year: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            pattern="\d{4}"
            placeholder="YYYY"
            required
            disabled={loading}
          />
        </div>

        <div className="sm:col-span-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_lab"
              checked={formData.is_lab}
              onChange={(e) => setFormData({ ...formData, is_lab: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              disabled={loading}
            />
            <label htmlFor="is_lab" className="ml-2 block text-sm text-gray-900">
              This is a laboratory class
            </label>
          </div>
        </div>
      </div>

      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : scheduleId ? 'Update Schedule' : 'Create Schedule'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  startOfWeek,
  endOfWeek, 
  format, 
  isToday, 
  isSameMonth,
  addMonths,
  subMonths,
  getDay
} from 'date-fns';

interface Schedule {
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_lab: boolean;
  course: {
    code: string;
    title: string;
    units: number;
  };
  room: {
    room_number: string;
  };
  section: {
    name: string;
  };
}

// Updated day mapping to match your data structure
const getScheduleDay = (date: Date): string => {
  const dayNumber = getDay(date);
  switch (dayNumber) {
    case 1: return 'M';    // Monday
    case 2: return 'T';    // Tuesday
    case 3: return 'W';    // Wednesday
    case 4: return 'TH';   // Thursday
    case 5: return 'F';    // Friday
    default: return '';    // Saturday (6) and Sunday (0)
  }
};

// Add missing getDayName function
const getDayName = (day: string): string => {
  switch (day) {
    case 'M': return 'Monday';
    case 'T': return 'Tuesday';
    case 'W': return 'Wednesday';
    case 'TH': return 'Thursday';
    case 'F': return 'Friday';
    default: return '';
  }
};

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0)); // January 2025
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const supabase = createClientComponentClient();

  // Get the full calendar days including the start and end of weeks
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  useEffect(() => {
    async function fetchSchedule() {
      const { data, error } = await supabase
        .from('course_schedules')
        .select(`
          day_of_week,
          start_time,
          end_time,
          is_lab,
          course:courses (
            code,
            title,
            units
          ),
          room:rooms (
            room_number
          ),
          section:sections (
            name
          )
        `)
        .order('start_time');

      if (error) {
        console.error('Error fetching schedule:', error);
        return;
      }

      if (data) {
        // Transform the data to match the Schedule interface
        const transformedData: Schedule[] = data.map(item => ({
          day_of_week: item.day_of_week,
          start_time: item.start_time,
          end_time: item.end_time,
          is_lab: item.is_lab,
          course: item.course as unknown as Schedule['course'],
          room: item.room as unknown as Schedule['room'],
          section: item.section as unknown as Schedule['section']
        }));
        setSchedules(transformedData);
      }
      setLoading(false);
    }

    fetchSchedule();
  }, [supabase]);

  const getSchedulesForDay = (date: Date) => {
    const scheduleDay = getScheduleDay(date);
    return schedules.filter(schedule => schedule.day_of_week === scheduleDay);
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).replace(':00', '');  // Remove the ':00' for cleaner display
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Faculty Schedule</h1>
              <p className="mt-1 text-sm text-gray-500">School Year: 2024-2025</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setView('calendar')}
                className={`px-4 py-2 rounded-lg ${
                  view === 'calendar' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Calendar View
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-lg ${
                  view === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                List View
              </button>
            </div>
          </div>
        </div>

        {view === 'calendar' ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Month navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded-full text-black"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded-full text-black"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-px border-b border-gray-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="bg-gray-50 py-2">
                  <div className="text-center text-sm font-medium text-gray-700">{day}</div>
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {calendarDays.map((day, index) => {
                const daySchedules = getSchedulesForDay(day);
                
                return (
                  <div
                    key={index}
                    className={`min-h-[150px] bg-white p-2 ${
                      !isSameMonth(day, currentDate) ? 'bg-gray-50' : ''
                    } ${isToday(day) ? 'bg-blue-50' : ''}`}
                  >
                    <div className={`text-right text-sm ${
                      !isSameMonth(day, currentDate) ? 'text-gray-400' : 'text-gray-700'
                    } ${isToday(day) ? 'font-bold' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="mt-1 space-y-1">
                      {daySchedules.map((schedule, scheduleIndex) => (
                        <div
                          key={scheduleIndex}
                          className={`p-1.5 rounded text-xs ${
                            schedule.is_lab 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          <div className="font-medium text-center mb-1">
                            {schedule.course.code}
                          </div>
                          <div className="grid grid-cols-[auto_1fr] gap-x-1 text-[11px] leading-relaxed">
                            <div className="text-gray-600">Time:</div>
                            <div>
                              {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                            </div>
                            <div className="text-gray-600">Room:</div>
                            <div>{schedule.room.room_number}</div>
                            <div className="text-gray-600">Section:</div>
                            <div>{schedule.section.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {['M', 'T', 'W', 'TH', 'F'].map((day) => {
              const daySchedules = schedules.filter(s => s.day_of_week === day);
              if (daySchedules.length === 0) return null;

              return (
                <div key={day} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getDayName(day)}
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {daySchedules.map((schedule, index) => (
                      <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">
                              {schedule.course.code} - {schedule.course.title}
                            </h4>
                            <div className="mt-1 text-sm text-gray-500">
                              {schedule.section.name} | {schedule.room.room_number}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            schedule.is_lab 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {schedule.is_lab ? 'Laboratory' : 'Lecture'}
                          </span>
                        </div>
                        <div className="mt-4 text-sm text-gray-600">
                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 
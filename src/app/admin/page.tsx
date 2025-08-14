import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function AdminDashboard() {
  const supabase = createServerComponentClient({ cookies });

  // Fetch summary counts
  const [
    { count: studentsCount },
    { count: coursesCount },
    { count: roomsCount },
    { count: sectionsCount }
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('rooms').select('*', { count: 'exact', head: true }),
    supabase.from('sections').select('*', { count: 'exact', head: true })
  ]);

  const stats = [
    { name: 'Total Students', value: studentsCount ?? 0, href: '/admin/students' },
    { name: 'Total Courses', value: coursesCount ?? 0, href: '/admin/courses' },
    { name: 'Total Rooms', value: roomsCount ?? 0, href: '/admin/rooms' },
    { name: 'Total Sections', value: sectionsCount ?? 0, href: '/admin/sections' }
  ];

  const quickActions = [
    {
      name: 'Manage Students',
      description: 'Add, edit, or remove student records',
      href: '/admin/students',
    },
    {
      name: 'Manage Courses',
      description: 'Add, edit, or remove course information',
      href: '/admin/courses',
    },
    {
      name: 'Course Schedules',
      description: 'Manage course schedules and timings',
      href: '/admin/schedules',
    },
    {
      name: 'Manage Rooms',
      description: 'Add or modify classroom assignments',
      href: '/admin/rooms',
    },
    {
      name: 'Manage Sections',
      description: 'Create and organize class sections',
      href: '/admin/sections',
    }
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900">Admin Dashboard</h1>
      
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow hover:bg-gray-50 transition-colors sm:p-6"
          >
            <dt className="truncate text-sm font-medium text-gray-500">{stat.name}</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stat.value}</dd>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-gray-900">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="block rounded-lg bg-white p-6 shadow hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-xl font-semibold text-gray-900">{action.name}</h3>
              <p className="mt-2 text-gray-600">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

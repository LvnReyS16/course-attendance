import { ReactNode } from 'react';
import Link from 'next/link';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h2 className="text-2xl font-semibold text-gray-800">Admin Panel</h2>
        </div>
        <nav className="mt-4">
          <ul className="space-y-2">
            <li>
              <Link 
                href="/admin"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <span className="mx-4">Dashboard</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/students"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <span className="mx-4">Students</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/courses"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <span className="mx-4">Courses</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/schedules"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <span className="mx-4">Course Schedules</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/rooms"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <span className="mx-4">Rooms</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/sections"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <span className="mx-4">Sections</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
        <div className="container mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

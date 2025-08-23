'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MdDashboard,
  MdPeople,
  MdSchool,
  MdSchedule,
  MdMeetingRoom,
  MdCategory,
} from 'react-icons/md';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  const navigationItems = [
    { href: '/admin', label: 'Dashboard', icon: <MdDashboard /> },
    { href: '/admin/students', label: 'Students', icon: <MdPeople /> },
    { href: '/admin/courses', label: 'Courses', icon: <MdSchool /> },
    { href: '/admin/schedules', label: 'Course Schedules', icon: <MdSchedule /> },
    { href: '/admin/rooms', label: 'Rooms', icon: <MdMeetingRoom /> },
    { href: '/admin/sections', label: 'Sections', icon: <MdCategory /> },
  ];

  return (
    <div
      className="flex bg-gradient-to-br from-slate-50 to-blue-50"
      style={{ height: 'calc(100vh - 4.5rem)' }} // subtract navbar height
    >
      {/* Sidebar */}
      <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 shadow-xl relative">
        <div className="p-[18px] border-b border-slate-200/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-bold">A</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">Admin Panel</h2>
              <p className="text-sm text-gray-500">Course Management</p>
            </div>
          </div>
        </div>

        <nav className="px-4 py-6 overflow-auto">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`group flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 ease-out border ${
                      isActive
                        ? 'text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'
                        : 'text-slate-700 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-transparent hover:border-blue-100'
                    }`}
                  >
                    <div className="relative">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ease-out group-hover:scale-105 ${
                          isActive
                            ? 'bg-blue-100'
                            : 'bg-slate-100 group-hover:bg-blue-100'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 !mt-1 !ml-1 transition-colors duration-300 ${
                            isActive
                              ? 'text-blue-600'
                              : 'text-slate-600 group-hover:text-blue-600'
                          }`}
                        >
                          {item.icon}
                        </div>
                      </div>
                      <div
                        className={`absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full transition-all duration-300 ${
                          isActive
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100'
                        }`}
                      ></div>
                    </div>
                    <div className="ml-4 flex-1">
                      <span
                        className={`font-semibold text-sm transition-colors duration-300 ${
                          isActive ? 'text-blue-700' : 'group-hover:text-blue-700'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 transition-all duration-300 ${
                        isActive
                          ? 'text-blue-500'
                          : 'text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200/0 bg-white/60 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">Admin User</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white backdrop-blur-xl border-b border-slate-200/50 shadow-sm flex items-center justify-between px-8">
          <h1 className="text-xl font-bold text-gray-800">Welcome back, Admin</h1>
          <div className="text-sm text-slate-600">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5 bg-white/70 backdrop-blur-md shadow-md">
          {children}
        </div>
      </main>
    </div>
  );
}

'use client';

import Link from 'next/link';

export default function AttendancePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Attendance Management
        </h1>

        <div className="space-y-4">
          <Link 
            href="/attendance/generate"
            className="block w-full py-2 px-4 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generate QR Code
          </Link>

          <Link 
            href="/attendance/records"
            className="block w-full py-2 px-4 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 transition-colors"
          >
            View Attendance Records
          </Link>
        </div>
      </div>
    </div>
  );
}
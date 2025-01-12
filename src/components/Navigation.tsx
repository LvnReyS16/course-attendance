import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="bg-gradient-to-r from-[#155E95] via-[#6A80B9] to-[#F6C794] shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl px-6 lg:px-8">
        <div className="flex items-center h-[4.5rem]">
          <div className="flex items-center space-x-12">
            <Link 
              href="/" 
              className="text-xl font-bold text-white hover:text-blue-100 transition-colors"
            >
              Home
            </Link>
            <div className="flex space-x-6">
              <Link
                href="/attendance"
                className="px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 rounded-lg transition-all duration-200"
              >
                Attendance
              </Link>
              <Link
                href="/attendance/records"
                className="px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 rounded-lg transition-all duration-200"
              >
                Records
              </Link>
              <Link
                href="/schedule"
                className="px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 rounded-lg transition-all duration-200"
              >
                Schedule
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 
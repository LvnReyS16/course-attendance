'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';

export default function Navigation() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="bg-gradient-to-r from-[#155E95] via-[#6A80B9] to-[#F6C794] shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-[4.5rem]">
          <div className="flex items-center space-x-12">
            <Link 
              href="/" 
              className="text-xl font-bold text-white hover:text-blue-100 transition-colors"
            >
              Home
            </Link>
            <div className="flex space-x-6">
              {isAuthenticated && (
                <>
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
                </>
              )}
              <Link
                href="/schedule"
                className="px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 rounded-lg transition-all duration-200"
              >
                Schedule
              </Link>
              {!isAuthenticated && (
                <Link
                  href="/login"
                  className="px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
          
          {isAuthenticated && (
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all duration-200"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
} 
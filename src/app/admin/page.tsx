import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  MdPeople,
  MdSchool,
  MdMeetingRoom,
  MdCategory,
  MdAdd,
  MdSchedule,
} from "react-icons/md";

export default async function AdminDashboard() {
  const supabase = createServerComponentClient({ cookies });

  const [
    { count: studentsCount },
    { count: coursesCount },
    { count: roomsCount },
    { count: sectionsCount },
  ] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("rooms").select("*", { count: "exact", head: true }),
    supabase.from("sections").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    {
      name: "Total Students",
      value: studentsCount ?? 0,
      href: "/admin/students",
      icon: <MdPeople className="w-6 h-6" />,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      name: "Total Courses",
      value: coursesCount ?? 0,
      href: "/admin/courses",
      icon: <MdSchool className="w-6 h-6" />,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      name: "Total Rooms",
      value: roomsCount ?? 0,
      href: "/admin/rooms",
      icon: <MdMeetingRoom className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      name: "Total Sections",
      value: sectionsCount ?? 0,
      href: "/admin/sections",
      icon: <MdCategory className="w-6 h-6" />,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
  ];

  const quickActions = [
    {
      name: "Add New Student",
      description: "Register a new student in the system",
      href: "/admin/students",
      icon: <MdAdd className="w-8 h-8" />,
      color: "from-blue-500 to-blue-600",
    },
    {
      name: "Create Course",
      description: "Add a new course to the curriculum",
      href: "/admin/courses",
      icon: <MdSchool className="w-8 h-8" />,
      color: "from-green-500 to-green-600",
    },
    {
      name: "Schedule Class",
      description: "Set up course schedules and timings",
      href: "/admin/schedules",
      icon: <MdSchedule className="w-8 h-8" />,
      color: "from-purple-500 to-purple-600",
    },
    {
      name: "Manage Rooms",
      description: "Configure classroom assignments",
      href: "/admin/rooms",
      icon: <MdMeetingRoom className="w-8 h-8" />,
      color: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      {/* <div className="text-left">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Welcome to Admin Dashboard
        </h1>
        <p className="mt-2 text-lg text-slate-600">
          Manage your course attendance system efficiently
        </p>
      </div> */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-200/50 hover:border-blue-200 transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {stat.name}
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stat.value}
                </p>
              </div>
              <div
                className={`p-3 rounded-xl ${stat.bgColor} transition-transform duration-300`}
              >
                <div className={stat.textColor}>{stat.icon}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-8">
        <h2 className="text-2xl font-bold text-slate-900 !mb-8">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="group p-6 rounded-2xl border border-slate-200/50 hover:border-blue-200 transition-all duration-300 bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 shadow-sm"
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`p-4 rounded-2xl bg-gradient-to-r ${action.color} text-white transition-all duration-300 shadow-lg group-hover:shadow-xl`}
                >
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-800 group-hover:text-blue-700 transition-colors mb-2">
                    {action.name}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed group-hover:text-slate-600 transition-colors">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

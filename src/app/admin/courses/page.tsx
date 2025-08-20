"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";
import DataTable from "@/components/DataTable";
import LoadingSpinner from "@/components/LoadingSpinner";
import { MdAdd, MdSchool } from "react-icons/md";

type Course = Database["public"]["Tables"]["courses"]["Row"];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("code");

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <div className="p-3 rounded-xl bg-green-50 text-green-600 shadow-sm">
              <MdSchool className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
              <p className="text-slate-600 text-sm">
                Manage course information and curriculum details
              </p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 hover:from-green-600 hover:to-green-700"
          >
            <MdAdd className="w-5 h-5" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/50">
          <h2 className="text-lg font-semibold text-slate-900">
            Course Records
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            A comprehensive list of all courses with their details and
            curriculum information
          </p>
        </div>
        <div className="p-6">
          <DataTable
            data={courses}
            columns={[
              {
                header: "Code",
                accessor: "code",
                sortable: true,
                filterable: true,
                getFilterOptions: (data) => [
                  ...new Set(data.map((course) => course.code)),
                ],
              },
              {
                header: "Title",
                accessor: "title",
                sortable: true,
                filterable: true,
                getFilterOptions: (data) => [
                  ...new Set(data.map((course) => course.title)),
                ],
              },
              {
                header: "Units",
                accessor: "units",
                sortable: true,
                filterable: true,
                getFilterOptions: (data) => [
                  ...new Set(data.map((course) => String(course.units))),
                ],
              },
              {
                header: "Lecture Hours",
                accessor: "lecture_hours",
                sortable: true,
                filterable: true,
                getFilterOptions: (data) => [
                  ...new Set(
                    data.map((course) => String(course.lecture_hours || "N/A"))
                  ),
                ],
              },
              {
                header: "Lab Hours",
                accessor: "lab_hours",
                sortable: true,
                filterable: true,
                getFilterOptions: (data) => [
                  ...new Set(
                    data.map((course) => String(course.lab_hours || "N/A"))
                  ),
                ],
              },
            ]}
            searchFields={["code", "title"]}
            isLoading={isLoading}
            onEdit={(id) => {
              // TODO: Implement edit functionality
              console.log("Edit course:", id);
            }}
            onDelete={async (id) => {
              // TODO: Implement delete functionality
              console.log("Delete course:", id);
            }}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import CourseForm from "@/components/CourseForm";
import { MdAdd, MdSchool } from "react-icons/md";

type Course = Database["public"]["Tables"]["courses"]["Row"];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
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

  const handleAddCourse = () => {
    setSelectedCourseId(null);
    setIsModalOpen(true);
  };

  const handleEditCourse = (id: string) => {
    setSelectedCourseId(id);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCourseId(null);
  };

  const handleFormSuccess = () => {
    fetchCourses();
    handleModalClose();
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh the courses list
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course. Please try again.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-4">
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
            onClick={handleAddCourse}
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
            onEdit={handleEditCourse}
            onDelete={handleDeleteCourse}
          />
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={selectedCourseId ? 'Edit Course' : 'Add New Course'}
      >
        <CourseForm
          courseId={selectedCourseId || undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";
import Modal from "@/components/Modal";
import CourseScheduleForm from "./CourseScheduleForm";
import DataTable from "@/components/DataTable";
import { MdAdd, MdSchedule } from "react-icons/md";

type Schedule = Database["public"]["Tables"]["course_schedules"]["Row"] & {
  courses: { code: string; title: string } | null;
  sections: { name: string; program: string } | null;
  rooms: { room_number: string } | null;
};

export default function SchedulesPage() {
  const supabase = createClientComponentClient<Database>();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null
  );

  const fetchSchedules = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("course_schedules")
        .select(
          `
          *,
          courses (
            code,
            title
          ),
          sections (
            name,
            program
          ),
          rooms (
            room_number
          )
        `
        )
        .order("day_of_week");

      if (fetchError) throw fetchError;
      setSchedules(data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch schedules";
      setError(errorMessage);
      console.error("Error fetching schedules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleDelete = async (scheduleId: string) => {
    try {
      setError(null);

      // Remove from UI first (optimistic update)
      setSchedules((current) => current.filter((s) => s.id !== scheduleId));

      const { error: deleteError } = await supabase
        .from("course_schedules")
        .delete()
        .eq("id", scheduleId)
        .select();

      if (deleteError) {
        // Revert UI on error
        await fetchSchedules();
        throw deleteError;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while deleting the schedule";
      setError(errorMessage);
      console.error("Error deleting schedule:", err);
    }
  };

  const handleEdit = (scheduleId: string) => {
    setSelectedScheduleId(scheduleId);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedScheduleId(null);
  };

  const handleFormSuccess = async () => {
    handleModalClose();
    await fetchSchedules();
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 shadow-sm">
              <MdSchedule className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Course Schedules
              </h1>
              <p className="text-slate-600 text-sm">
                Manage course schedules, including time slots, rooms, and
                sections
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 hover:from-purple-600 hover:to-purple-700"
          >
            <MdAdd className="w-5 h-5" />
            <span>Add Schedule</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Data Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/50">
          <h2 className="text-lg font-semibold text-slate-900">
            Schedule Records
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            A comprehensive list of all course schedules with their details and
            timing information
          </p>
        </div>
        <div className="p-6">
          <DataTable
            data={schedules}
            columns={[
              {
                header: "Course",
                accessor: (schedule) =>
                  `${schedule.courses?.code || ""} - ${schedule.courses?.title || ""
                  }`,
                sortable: true,
                filterable: true,
                getFilterOptions: (data) => {
                  const courses = new Set<string>();
                  data.forEach((schedule) => {
                    if (schedule.courses?.code) {
                      courses.add(
                        `${schedule.courses.code} - ${schedule.courses.title}`
                      );
                    }
                  });
                  return Array.from(courses).sort();
                },
              },
              {
                header: "Section",
                accessor: (schedule) =>
                  `${schedule.sections?.name || ""} (${schedule.sections?.program || ""
                  })`,
                sortable: true,
                filterable: true,
                getFilterOptions: (data) => {
                  const sections = new Set<string>();
                  data.forEach((schedule) => {
                    if (schedule.sections?.name) {
                      sections.add(
                        `${schedule.sections.name} (${schedule.sections.program})`
                      );
                    }
                  });
                  return Array.from(sections).sort();
                },
              },
              {
                header: "Day",
                accessor: "day_of_week",
                sortable: true,
                filterable: true,
                getFilterOptions: (data) => {
                  const days = new Set(
                    data.map((schedule) => schedule.day_of_week)
                  );
                  return Array.from(days).sort();
                },
              },
              {
                header: "Time",
                accessor: (schedule) =>
                  `${schedule.start_time} - ${schedule.end_time}`,
                sortable: true,
              },
              {
                header: "Room",
                accessor: (schedule) => schedule.rooms?.room_number || "",
                sortable: true,
                filterable: true,
                getFilterOptions: (data) => {
                  const rooms = new Set<string>();
                  data.forEach((schedule) => {
                    if (schedule.rooms?.room_number) {
                      rooms.add(schedule.rooms.room_number);
                    }
                  });
                  return Array.from(rooms).sort();
                },
              },
              {
                header: "Type",
                accessor: (schedule) =>
                  schedule.is_lab ? "Laboratory" : "Lecture",
                sortable: true,
                filterable: true,
                getFilterOptions: () => ["Laboratory", "Lecture"],
              },
              {
                header: "Semester",
                accessor: "semester",
                sortable: true,
                filterable: true,
                getFilterOptions: (data) => {
                  const semesters = new Set(
                    data.map((schedule) => schedule.semester)
                  );
                  return Array.from(semesters).sort();
                },
              },
            ]}
            searchFields={[
              "course_id",
              "section_id",
              "room_id",
              "semester",
              "day_of_week",
              "start_time",
              "end_time",
              "is_lab",
            ]}
            onDelete={handleDelete}
            onEdit={handleEdit}
            isLoading={loading}
          />
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={selectedScheduleId ? "Edit Schedule" : "Add New Schedule"}
      >
        <CourseScheduleForm
          scheduleId={selectedScheduleId || undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>
    </div>
  );
}

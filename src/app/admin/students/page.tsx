'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import Modal from '@/components/Modal';
import StudentForm from './StudentForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataTable from '@/components/DataTable';
import { MdPeople, MdAdd } from 'react-icons/md';

type Student = Database['public']['Tables']['students']['Row'] & {
  sections: { name: string; program: string } | null;
  courses: { code: string; title: string } | null;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          sections (
            name,
            program
          ),
          courses (
            code,
            title
          )
        `)
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (studentId: string) => {
    try {
      setError(null);

      // First check if student has any attendance records
      const { data: attendanceRecords, error: checkError } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('student_id', studentId)
        .limit(1);

      if (checkError) {
        throw new Error(checkError.message);
      }

      if (attendanceRecords && attendanceRecords.length > 0) {
        setError('Cannot delete student because they have attendance records. Please delete the attendance records first.');
        return;
      }

      // If no attendance records, proceed with deletion
      if (!confirm('Are you sure you want to delete this student?')) return;

      // Remove from UI first (optimistic update)
      setStudents(current => current.filter(s => s.id !== studentId));

      const { error: deleteError } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)
        .select(); // Add .select() to ensure the delete operation completes

      if (deleteError) {
        // Revert UI on error
        await fetchStudents();
        throw new Error(deleteError.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while deleting the student';
      setError(errorMessage);
      console.error('Error deleting student:', err);
    }
  };

  const handleEdit = (studentId: string) => {
    setSelectedStudentId(studentId);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedStudentId(null);
  };

  const handleFormSuccess = async () => {
    handleModalClose();
    await fetchStudents();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
              <MdPeople className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Students</h1>
              <p className="text-slate-600 text-sm">
                Manage student information and enrollment
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 hover:from-blue-600 hover:to-blue-700"
          >
            <MdAdd className="w-5 h-5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="p-1.5 rounded-lg bg-red-100">
                <svg className="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="flex-shrink-0 p-1.5 rounded-lg text-red-500 hover:bg-red-100 transition-colors duration-200"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Data Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/50">
          <h2 className="text-lg font-semibold text-slate-900">Student Records</h2>
          <p className="text-slate-600 text-sm mt-1">
            A comprehensive list of all students with their details and enrollment information
          </p>
        </div>
        <div className="px-5 py-2 whitespace-nowrap">
          <DataTable
            data={students}
            columns={[
              {
                header: 'Name',
                accessor: 'name',
                sortable: true
              },
              {
                header: 'Email',
                accessor: 'email',
                sortable: true
              },
              {
                header: 'Section',
                accessor: (student) => `${student.sections?.name || ''} (${student.sections?.program || ''})`,
                filterable: true,
                getFilterOptions: (data) => {
                  const sections = new Set<string>();
                  data.forEach(student => {
                    if (student.sections?.name) {
                      sections.add(`${student.sections.name} (${student.sections.program})`);
                    }
                  });
                  return Array.from(sections).sort();
                }
              },
              {
                header: 'Course',
                accessor: (student) => `${student.courses?.code || ''} - ${student.courses?.title || ''}`,
                filterable: true,
                getFilterOptions: (data) => {
                  const courses = new Set<string>();
                  data.forEach(student => {
                    if (student.courses?.code) {
                      courses.add(`${student.courses.code} - ${student.courses.title}`);
                    }
                  });
                  return Array.from(courses).sort();
                }
              },
              {
                header: 'Year Level',
                accessor: 'year_level',
                sortable: true,
                filterable: true,
                getFilterOptions: (data) => {
                  const yearLevels = new Set<string>();
                  data.forEach(student => {
                    if (student.year_level) {
                      yearLevels.add(String(student.year_level));
                    }
                  });
                  return Array.from(yearLevels).sort((a, b) => Number(a) - Number(b));
                }
              }
            ]}
            searchFields={['name', 'email']}
            onDelete={handleDelete}
            onEdit={handleEdit}
            isLoading={loading}
          />
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={selectedStudentId ? 'Edit Student' : 'Add New Student'}
      >
        <StudentForm
          studentId={selectedStudentId || undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>
    </div>
  );
}

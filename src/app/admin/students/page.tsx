'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import Modal from '@/components/Modal';
import StudentForm from './StudentForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataTable from '@/components/DataTable';

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
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-semibold text-gray-900">Students</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all students including their name, email, section, and year level.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add Student
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

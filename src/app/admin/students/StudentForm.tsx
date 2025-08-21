'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';
import LoadingSpinner from '@/components/LoadingSpinner';

interface StudentFormProps {
  studentId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StudentForm({ studentId, onSuccess, onCancel }: StudentFormProps) {
  const supabase = createClientComponentClient<Database>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sections, setSections] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [uploadMode, setUploadMode] = useState<'single' | 'csv'>('single');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvPreview, setCsvPreview] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    year_level: 1,
    section_id: '',
    course_id: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        // Fetch sections and courses for dropdowns
        const [sectionsResponse, coursesResponse] = await Promise.all([
          supabase.from('sections').select('id, name, program'),
          supabase.from('courses').select('id, code, title')
        ]);

        if (sectionsResponse.error) throw sectionsResponse.error;
        if (coursesResponse.error) throw coursesResponse.error;

        setSections(sectionsResponse.data || []);
        setCourses(coursesResponse.data || []);

        // If editing, fetch student data
        if (studentId) {
          const { data: student, error } = await supabase
            .from('students')
            .select('*')
            .eq('id', studentId)
            .single();

          if (error) throw error;

          if (student) {
            setFormData({
              name: student.name,
              email: student.email,
              year_level: student.year_level,
              section_id: student.section_id || '',
              course_id: student.course_id || ''
            });
          }
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load form data');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [studentId, supabase]);

  const [error, setError] = useState<string | null>(null);

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      parseCSV(file);
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const parseSection = (sectionStr: string) => {
    // Parse section like "BSIT4A" to extract the section name part (IT4A)
    const match = sectionStr.match(/^BS(.+)$/);
    if (!match) return null;
    
    // Extract the part after "BS" (e.g., "IT4A" from "BSIT4A")
    const sectionName = match[1];
    
    return {
      name: sectionName
    };
  };

  const parseCSV = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setError('CSV file must have at least a header row and one data row');
        return;
      }

      const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
      const requiredHeaders = ['id', 'name', 'year_level', 'email', 'section', 'subject_code'];
      
      // Check if required headers exist
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      if (missingHeaders.length > 0) {
        setError(`Missing required columns: ${missingHeaders.join(', ')}`);
        return;
      }

      // Fetch all sections and courses from database for matching
      const [sectionsResponse, coursesResponse] = await Promise.all([
        supabase.from('sections').select('id, name'),
        supabase.from('courses').select('id, code')
      ]);

      if (sectionsResponse.error) {
        setError(`Error fetching sections: ${sectionsResponse.error.message}`);
        return;
      }

      if (coursesResponse.error) {
        setError(`Error fetching courses: ${coursesResponse.error.message}`);
        return;
      }

      const sectionsMap = new Map();
      sectionsResponse.data?.forEach(section => {
        sectionsMap.set(section.name, section.id);
      });

      const coursesMap = new Map();
      coursesResponse.data?.forEach(course => {
        coursesMap.set(course.code, course.id);
      });

      const data = [];
      const preview = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        const values = parseCSVLine(lines[i]);
        if (values.length !== headers.length) {
          console.warn(`Row ${i + 1}: Expected ${headers.length} columns, got ${values.length}. Skipping row.`);
          continue;
        }
        
        const row: any = {};
        headers.forEach((header, index) => {
          // Remove quotes if present
          let value = values[index];
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          row[header] = value;
        });

        // Validate required fields
        if (!row.id || !row.name || !row.year_level || !row.email || !row.section || !row.subject_code) {
          setError(`Row ${i + 1}: Missing required fields (id, name, year_level, email, section, subject_code)`);
          return;
        }

        // Validate year_level is a number between 1-4
        const yearLevel = parseInt(row.year_level);
        if (isNaN(yearLevel) || yearLevel < 1 || yearLevel > 4) {
          setError(`Row ${i + 1}: year_level must be a number between 1 and 4`);
          return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          setError(`Row ${i + 1}: Invalid email format`);
          return;
        }

        // Parse and validate section
        const parsedSection = parseSection(row.section);
        if (!parsedSection) {
          setError(`Row ${i + 1}: Invalid section format. Expected format like 'BSIT4A'`);
          return;
        }

        // Find matching section in database by name
        const sectionId = sectionsMap.get(parsedSection.name) || null;

        // Find matching course in database by code
        const courseId = coursesMap.get(row.subject_code) || null;

        data.push({
          id: row.id,
          name: row.name,
          email: row.email,
          year_level: yearLevel,
          section_id: sectionId,
          course_id: courseId,
          _section_text: row.section, // Keep original for preview
          _section_matched: !!sectionId,
          _subject_text: row.subject_code, // Keep original for preview
          _subject_matched: !!courseId
        });

        const sectionStatus = sectionId ? '✓' : '✗';
        const subjectStatus = courseId ? '✓' : '✗';
        preview.push(`${row.id} - ${row.name} (Year ${yearLevel}) [${row.section} ${sectionStatus}] [${row.subject_code} ${subjectStatus}]`);
      }

      setCsvData(data);
      setCsvPreview(preview.slice(0, 5).join('\n') + (preview.length > 5 ? `\n... and ${preview.length - 5} more` : ''));
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    if (csvData.length === 0) {
      setError('No data to upload');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check which student IDs already exist in database
      const existingIds = csvData.map(student => student.id);
      const { data: existingStudents, error: checkError } = await supabase
        .from('students')
        .select('id')
        .in('id', existingIds);

      if (checkError) throw checkError;

      const existingStudentIds = new Set(existingStudents?.map(s => s.id) || []);
      
      // Clean up the data by removing temporary fields
      const cleanedData = csvData.map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
        year_level: student.year_level,
        section_id: student.section_id,
        course_id: student.course_id
      }));
      
      const studentsToInsert = cleanedData.filter(student => !existingStudentIds.has(student.id));
      const studentsToUpdate = cleanedData.filter(student => existingStudentIds.has(student.id));

      let insertedCount = 0;
      let updatedCount = 0;

      // Insert new students
      if (studentsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('students')
          .insert(studentsToInsert);

        if (insertError) throw insertError;
        insertedCount = studentsToInsert.length;
      }

      // Update existing students
      if (studentsToUpdate.length > 0) {
        for (const student of studentsToUpdate) {
          const { error: updateError } = await supabase
            .from('students')
            .update({
              name: student.name,
              email: student.email,
              year_level: student.year_level,
              section_id: student.section_id,
              course_id: student.course_id
            })
            .eq('id', student.id);

          if (updateError) throw updateError;
          updatedCount++;
        }
      }

      // Show success message with counts
      if (insertedCount > 0 && updatedCount > 0) {
        alert(`Success! ${insertedCount} students added and ${updatedCount} students updated.`);
      } else if (insertedCount > 0) {
        alert(`Success! ${insertedCount} students added.`);
      } else if (updatedCount > 0) {
        alert(`Success! ${updatedCount} students updated.`);
      }

      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while uploading students';
      setError(errorMessage);
      console.error('Error uploading students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (studentId) {
        // Check if student has attendance records before allowing section/course change
        const { data: attendanceRecords, error: checkError } = await supabase
          .from('attendance_records')
          .select('id')
          .eq('student_id', studentId)
          .limit(1);

        if (checkError) {
          throw new Error(checkError.message);
        }

        // Get current student data
        const { data: currentStudent, error: fetchError } = await supabase
          .from('students')
          .select('section_id, course_id')
          .eq('id', studentId)
          .single();

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        // If student has attendance records and trying to change section or course
        if (attendanceRecords?.length > 0 &&
          (currentStudent?.section_id !== formData.section_id ||
            currentStudent?.course_id !== formData.course_id)) {
          setError('Cannot change section or course for a student with existing attendance records.');
          return;
        }

        // Update existing student
        const { error: updateError } = await supabase
          .from('students')
          .update(formData)
          .eq('id', studentId);

        if (updateError) {
          throw new Error(updateError.message);
        }
      } else {
        // Create new student
        const { error: insertError } = await supabase
          .from('students')
          .insert([{ ...formData, id: crypto.randomUUID() }]);

        if (insertError) {
          throw new Error(insertError.message);
        }
      }

      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while saving the student';
      setError(errorMessage);
      console.error('Error saving student:', err);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
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
                  type="button"
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

      {/* Only show mode selector for new students (not editing) */}
      {!studentId && (
        <div className="border-b border-gray-200 pb-4">
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setUploadMode('single')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                uploadMode === 'single'
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              disabled={loading}
            >
              Add Single Student
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('csv')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                uploadMode === 'csv'
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              disabled={loading}
            >
              Upload CSV
            </button>
          </div>
        </div>
      )}

      {uploadMode === 'csv' && !studentId ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Students via CSV</h3>
            <p className="text-sm text-gray-600 mb-2">
              Upload a CSV file with columns: <strong>id</strong>, <strong>name</strong>, <strong>year_level</strong>, <strong>email</strong>, <strong>section</strong>, <strong>subject_code</strong>. 
              Section format should be like 'BSIT4A' (will match section name 'IT4A' in database). Subject code should match existing course codes.
              <br />
              <strong>Note:</strong> Existing student IDs will be updated, new IDs will be added. Section and subject will be matched against database or set to null if not found.
            </p>
            <a 
              href="/sample_students.csv" 
              download="sample_students.csv"
              className="text-sm text-indigo-600 hover:text-indigo-800 underline"
            >
              Download sample CSV template
            </a>
          </div>

          <div>
            <label htmlFor="csv-file" className="block text-sm font-medium text-gray-700 mb-2">
              Choose CSV File
            </label>
            <input
              type="file"
              id="csv-file"
              accept=".csv"
              onChange={handleCsvFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100
                disabled:file:bg-gray-100 disabled:file:text-gray-500"
              disabled={loading}
            />
          </div>

          {csvPreview && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview ({csvData.length} students)
              </label>
              <div className="bg-gray-50 border rounded-md p-3">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{csvPreview}</pre>
              </div>
            </div>
          )}

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <button
              type="button"
              onClick={handleBulkSubmit}
              disabled={loading || csvData.length === 0}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Uploading...' : `Upload ${csvData.length} Students`}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          required
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          required
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="year_level" className="block text-sm font-medium text-gray-700">
          Year Level
        </label>
        <select
          id="year_level"
          value={formData.year_level}
          onChange={(e) => setFormData({ ...formData, year_level: parseInt(e.target.value) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {[1, 2, 3, 4].map((year) => (
            <option key={year} value={year}>
              Year {year}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="section" className="block text-sm font-medium text-gray-700">
          Section
        </label>
        <select
          id="section"
          value={formData.section_id}
          onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <option value="">Select a section</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.name} - {section.program}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="course" className="block text-sm font-medium text-gray-700">
          Course
        </label>
        <select
          id="course"
          value={formData.course_id}
          onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <option value="">Select a course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.title}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : studentId ? 'Update' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
        </form>
      )}
    </div>
  );
}

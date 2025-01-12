import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Student {
  id: string;
  name: string;
  section_id: string;
  course_id: string;
  section: {
    id: string;
    name: string;
  };
  course: {
    id: string;
    code: string;
  };
}

interface StudentSearchProps {
  sectionId: string;
  courseId: string;
  onSelectStudent: (student: Student) => void;
}

export default function StudentSearch({ sectionId, courseId, onSelectStudent }: StudentSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const supabase = createClientComponentClient();

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedStudent(null);
    
    if (value.length >= 2) {
      const { data } = await supabase
        .from('students')
        .select(`
          id,
          name,
          section_id,
          course_id,
          section:sections (
            id,
            name
          ),
          course:courses (
            id,
            code
          )
        `)
        .eq('section_id', sectionId)
        .eq('course_id', courseId)
        .filter('name', 'ilike', `%${value}%`);

      console.log('Search results:', data); // For debugging
      setResults(data as unknown as Student[]);
    } else {
      setResults([]);
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setResults([]);
    setSearchTerm('');
  };

  const handleSubmit = () => {
    if (selectedStudent) {
      onSelectStudent(selectedStudent);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          autoFocus
        />
        
        {results.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border max-h-60 overflow-auto">
            {results.map((student) => (
              <button
                key={student.id}
                onClick={() => handleSelectStudent(student)}
                className="w-full p-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
              >
                <p className="font-medium text-gray-900">{student.name}</p>
                <p className="text-sm text-gray-500">
                  {student.section.name} - {student.course.code}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedStudent && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Selected Student</h3>
          <div className="space-y-1">
            <p className="text-gray-900">{selectedStudent.name}</p>
            <p className="text-sm text-gray-500">Section: {selectedStudent.section.name}</p>
            <p className="text-sm text-gray-500">Course: {selectedStudent.course.code}</p>
          </div>
          <button
            onClick={handleSubmit}
            className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit Attendance
          </button>
        </div>
      )}
    </div>
  );
} 
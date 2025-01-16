import { useState, useRef, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Custom debounce function
function debounce<T extends (...args: Parameters<T>) => Promise<void> | void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

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
  isSubmitting: boolean;
  onSelectStudent: (student: Student) => void;
}

export default function StudentSearch({ sectionId, courseId, isSubmitting, onSelectStudent }: StudentSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const supabase = createClientComponentClient();

  // Create a persistent debounced search function using useRef
  const debouncedSearchRef = useRef(
    debounce(async (value: string) => {
      if (value.length >= 2) {
        setIsSearching(true);
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

        setResults(data as unknown as Student[]);
        setIsSearching(false);
      } else {
        setResults([]);
      }
    }, 500)
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedStudent(null);
    debouncedSearchRef.current(value);
  };

  // Cleanup on unmount
  useEffect(() => {
    const currentSearch = debouncedSearchRef.current;
    return () => {
      clearTimeout(currentSearch as unknown as NodeJS.Timeout);
    };
  }, []);

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
        
        {isSearching && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
        
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
            disabled={isSubmitting}
            className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting...
              </div>
            ) : (
              'Submit Attendance'
            )}
          </button>
        </div>
      )}
    </div>
  );
} 
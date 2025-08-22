'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

type Section = Database['public']['Tables']['sections']['Row'];
type Course = Database['public']['Tables']['courses']['Row'];

interface SectionFormProps {
  sectionId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SectionForm({ sectionId, onSuccess, onCancel }: SectionFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    program: '',
    year_level: '',
    course_id: ''
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    fetchCourses();
    if (sectionId) {
      fetchSection();
    }
  }, [sectionId]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('code');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchSection = async () => {
    try {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('id', sectionId || '')
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name || '',
          program: data.program || '',
          year_level: String(data.year_level || ''),
          course_id: data.course_id || ''
        });
      }
    } catch (error) {
      console.error('Error fetching section:', error);
      setError('Failed to fetch section data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const sectionData = {
        name: formData.name.trim(),
        program: formData.program.trim(),
        year_level: parseInt(formData.year_level) || 1,
        course_id: formData.course_id || null
      };

      if (sectionId) {
        // Update existing section
        const { error } = await supabase
          .from('sections')
          .update(sectionData)
          .eq('id', sectionId);

        if (error) throw error;
      } else {
        // Create new section
        const { error } = await supabase
          .from('sections')
          .insert([sectionData]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving section:', error);
      setError('Failed to save section');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Section Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="ex. IT1A, IT1B"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Program *
          </label>
          <input
            type="text"
            name="program"
            value={formData.program}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="ex. BSCS"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year Level *
          </label>
          <select
            name="year_level"
            value={formData.year_level}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select year level...</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
            <option value="5">5th Year</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course
          </label>
          <select
            name="course_id"
            value={formData.course_id}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select course...</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : (sectionId ? 'Update Section' : 'Add Section')}
        </button>
      </div>
    </form>
  );
}

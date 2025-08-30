'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

interface RoomFormProps {
  roomId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RoomForm({ roomId, onSuccess, onCancel }: RoomFormProps) {
  const [formData, setFormData] = useState({
    room_number: '',
    room_type: '',
    capacity: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    if (roomId) {
      fetchRoom();
    }
  }, [roomId]);

  const fetchRoom = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId || '')
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          room_number: data.room_number || '',
          room_type: data.room_type || '',
          capacity: String(data.capacity || '')
        });
      }
    } catch (error) {
      console.error('Error fetching room:', error);
      setError('Failed to fetch room data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const roomData = {
        room_number: formData.room_number.trim(),
        room_type: formData.room_type.trim() || null,
        capacity: parseInt(formData.capacity) || null
      };

      if (roomId) {
        // Update existing room
        const { error } = await supabase
          .from('rooms')
          .update(roomData)
          .eq('id', roomId);

        if (error) throw error;
      } else {
        // Create new room
        const { error } = await supabase
          .from('rooms')
          .insert([roomData]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving room:', error);
      setError('Failed to save room');
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
            Room Number *
          </label>
          <input
            type="text"
            name="room_number"
            value={formData.room_number}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 101, A101, Lab 1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Room Type
          </label>
          <select
            name="room_type"
            value={formData.room_type}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select room type...</option>
            <option value="LABORATORY">Laboratory</option>
            <option value="LECTURE">Lecture</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Capacity
          </label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            min="1"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 30"
          />
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
          {isLoading ? 'Saving...' : (roomId ? 'Update Room' : 'Add Room')}
        </button>
      </div>
    </form>
  );
}

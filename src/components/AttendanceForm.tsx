/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';

interface AttendanceFormProps {
  student: any;
  coordinates: { latitude: number; longitude: number } | null;
}

export default function AttendanceForm({ 
  student, 
  coordinates
}: AttendanceFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Generate timestamp only when submitting
      // const timestamp = new Date().toISOString();
      
      // Uncomment and implement this when ready
      // await submitAttendance({
      //   studentId: student.id,
      //   coordinates,
      //   timestamp,
      // });
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center text-green-600">
        <h3 className="text-xl font-semibold">Attendance Recorded!</h3>
        <p className="mt-2">Thank you for submitting your attendance.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="font-medium">Confirming attendance for:</p>
        <p className="text-lg">{student.name}</p>
      </div>

      {error && (
        <div className="p-3 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !coordinates}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Confirm Attendance'}
      </button>
    </form>
  );
} 
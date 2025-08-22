/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { sessionId, studentId, sectionId, courseId, timestamp, status } = await req.json();

    // Check for existing attendance record
    const { data: existingRecord } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .single();

    if (existingRecord) {
      return NextResponse.json(
        { error: 'Student has already submitted attendance for this session' },
        { status: 400 }
      );
    }

    // Insert new attendance record
    const { data, error } = await supabase
      .from('attendance_records')
      .insert([
        {
          session_id: sessionId,
          student_id: studentId,
          section_id: sectionId,
          course_id: courseId,
          timestamp: timestamp,
          status: status,
          verification_method: 'qr'
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Attendance submission error:', error);
    return NextResponse.json(
      { error: 'Failed to record attendance' },
      { status: 500 }
    );
  }
} 
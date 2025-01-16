export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attendance_records: {
        Row: {
          device_ip_address: unknown | null
          device_user_agent: string | null
          id: string
          latitude: number | null
          longitude: number | null
          session_id: string | null
          status: string
          student_id: string | null
          timestamp: string | null
          verification_method: string
        }
        Insert: {
          device_ip_address?: unknown | null
          device_user_agent?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          session_id?: string | null
          status: string
          student_id?: string | null
          timestamp?: string | null
          verification_method: string
        }
        Update: {
          device_ip_address?: unknown | null
          device_user_agent?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          session_id?: string | null
          status?: string
          student_id?: string | null
          timestamp?: string | null
          verification_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          course_id: string | null
          created_at: string | null
          date: string
          expires_at: string
          id: string
          instructor_id: string | null
          section_id: string | null
          status: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          date: string
          expires_at: string
          id?: string
          instructor_id?: string | null
          section_id?: string | null
          status?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          date?: string
          expires_at?: string
          id?: string
          instructor_id?: string | null
          section_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      course_schedules: {
        Row: {
          course_id: string | null
          created_at: string | null
          day_of_week: string
          end_time: string
          id: string
          is_lab: boolean | null
          room_id: string | null
          school_year: string
          section_id: string | null
          semester: string
          start_time: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          day_of_week: string
          end_time: string
          id?: string
          is_lab?: boolean | null
          room_id?: string | null
          school_year: string
          section_id?: string | null
          semester: string
          start_time: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          day_of_week?: string
          end_time?: string
          id?: string
          is_lab?: boolean | null
          room_id?: string | null
          school_year?: string
          section_id?: string | null
          semester?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_schedules_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_schedules_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          instructor_id: string | null
          lab_hours: number | null
          lecture_hours: number | null
          title: string
          units: number
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          instructor_id?: string | null
          lab_hours?: number | null
          lecture_hours?: number | null
          title: string
          units: number
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          instructor_id?: string | null
          lab_hours?: number | null
          lecture_hours?: number | null
          title?: string
          units?: number
        }
        Relationships: []
      }
      rooms: {
        Row: {
          capacity: number | null
          created_at: string | null
          id: string
          room_number: string
          room_type: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          room_number: string
          room_type?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          room_number?: string
          room_type?: string | null
        }
        Relationships: []
      }
      sections: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: string
          name: string
          program: string
          year_level: number
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          program: string
          year_level: number
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          program?: string
          year_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          course_id: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          section_id: string | null
          updated_at: string | null
          year_level: number
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          email: string
          id: string
          name: string
          section_id?: string | null
          updated_at?: string | null
          year_level: number
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          section_id?: string | null
          updated_at?: string | null
          year_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "students_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          id: number
          password: string | null
          username: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          password?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          password?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

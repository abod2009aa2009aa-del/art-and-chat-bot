export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alyssa_file_versions: {
        Row: {
          content: string
          created_at: string
          file_id: string
          id: number
          note: string | null
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          file_id: string
          id?: number
          note?: string | null
          version: number
        }
        Update: {
          content?: string
          created_at?: string
          file_id?: string
          id?: number
          note?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "alyssa_file_versions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "alyssa_files"
            referencedColumns: ["id"]
          },
        ]
      }
      alyssa_files: {
        Row: {
          bytes: number
          content: string
          created_at: string
          id: string
          language: string | null
          path: string
          project_id: string
          updated_at: string
          version: number
        }
        Insert: {
          bytes?: number
          content?: string
          created_at?: string
          id?: string
          language?: string | null
          path: string
          project_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          bytes?: number
          content?: string
          created_at?: string
          id?: string
          language?: string | null
          path?: string
          project_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "alyssa_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "alyssa_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      alyssa_job_steps: {
        Row: {
          created_at: string
          id: number
          idx: number
          job_id: string
          name: string
          output: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: number
          idx: number
          job_id: string
          name: string
          output?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: number
          idx?: number
          job_id?: string
          name?: string
          output?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "alyssa_job_steps_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "alyssa_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      alyssa_jobs: {
        Row: {
          chat_id: number
          created_at: string
          current_step: string | null
          error: string | null
          id: string
          last_successful_chunk: string | null
          owner_id: number
          plan: Json
          progress: number
          progress_message_id: number | null
          project_id: string | null
          retry_count: number
          status: string
          step_index: number
          title: string
          total_steps: number
          updated_at: string
        }
        Insert: {
          chat_id: number
          created_at?: string
          current_step?: string | null
          error?: string | null
          id?: string
          last_successful_chunk?: string | null
          owner_id: number
          plan?: Json
          progress?: number
          progress_message_id?: number | null
          project_id?: string | null
          retry_count?: number
          status?: string
          step_index?: number
          title: string
          total_steps?: number
          updated_at?: string
        }
        Update: {
          chat_id?: number
          created_at?: string
          current_step?: string | null
          error?: string | null
          id?: string
          last_successful_chunk?: string | null
          owner_id?: number
          plan?: Json
          progress?: number
          progress_message_id?: number | null
          project_id?: string | null
          retry_count?: number
          status?: string
          step_index?: number
          title?: string
          total_steps?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alyssa_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "alyssa_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      alyssa_logs: {
        Row: {
          created_at: string
          id: number
          level: string
          message: string
          meta: Json | null
          scope: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          level?: string
          message: string
          meta?: Json | null
          scope?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          level?: string
          message?: string
          meta?: Json | null
          scope?: string | null
        }
        Relationships: []
      }
      alyssa_projects: {
        Row: {
          chat_id: number | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: number
          state: Json
          status: string
          technology: string | null
          updated_at: string
        }
        Insert: {
          chat_id?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: number
          state?: Json
          status?: string
          technology?: string | null
          updated_at?: string
        }
        Update: {
          chat_id?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: number
          state?: Json
          status?: string
          technology?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      alyssa_research: {
        Row: {
          created_at: string
          id: number
          owner_id: number | null
          query: string
          results: Json
        }
        Insert: {
          created_at?: string
          id?: number
          owner_id?: number | null
          query: string
          results?: Json
        }
        Update: {
          created_at?: string
          id?: number
          owner_id?: number | null
          query?: string
          results?: Json
        }
        Relationships: []
      }
      alyssa_tool_calls: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: number
          input: Json | null
          job_id: string | null
          ok: boolean
          output_summary: string | null
          owner_id: number | null
          project_id: string | null
          tool: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: number
          input?: Json | null
          job_id?: string | null
          ok?: boolean
          output_summary?: string | null
          owner_id?: number | null
          project_id?: string | null
          tool: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: number
          input?: Json | null
          job_id?: string | null
          ok?: boolean
          output_summary?: string | null
          owner_id?: number | null
          project_id?: string | null
          tool?: string
        }
        Relationships: []
      }
      alyssa_users: {
        Row: {
          created_at: string
          first_name: string | null
          is_developer: boolean
          lang: string | null
          last_seen: string
          telegram_id: number
          username: string | null
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          is_developer?: boolean
          lang?: string | null
          last_seen?: string
          telegram_id: number
          username?: string | null
        }
        Update: {
          created_at?: string
          first_name?: string | null
          is_developer?: boolean
          lang?: string | null
          last_seen?: string
          telegram_id?: number
          username?: string | null
        }
        Relationships: []
      }
      telegram_messages: {
        Row: {
          chat_id: number
          chat_type: string
          content: string
          created_at: string
          id: number
          role: string
          user_id: number | null
          user_name: string | null
        }
        Insert: {
          chat_id: number
          chat_type: string
          content: string
          created_at?: string
          id?: number
          role: string
          user_id?: number | null
          user_name?: string | null
        }
        Update: {
          chat_id?: number
          chat_type?: string
          content?: string
          created_at?: string
          id?: number
          role?: string
          user_id?: number | null
          user_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

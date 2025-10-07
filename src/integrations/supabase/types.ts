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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      claim_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_used: boolean | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_codes_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_videos: {
        Row: {
          completed_at: string | null
          created_at: string | null
          event_id: string
          id: string
          metadata: Json | null
          status: string
          stripe_session_id: string
          video_url: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          metadata?: Json | null
          status?: string
          stripe_session_id: string
          video_url?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          metadata?: Json | null
          status?: string
          stripe_session_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_videos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          allow_guest_view: boolean | null
          auto_delete_date: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          event_date: string
          guest_passcode_hash: string | null
          host_id: string
          id: string
          is_public_gallery: boolean | null
          location: string | null
          max_photos: number | null
          name: string
          qr_code_url: string | null
          require_approval: boolean | null
          storage_extended_until: string | null
          updated_at: string | null
          upload_code: string
        }
        Insert: {
          allow_guest_view?: boolean | null
          auto_delete_date?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          event_date: string
          guest_passcode_hash?: string | null
          host_id: string
          id?: string
          is_public_gallery?: boolean | null
          location?: string | null
          max_photos?: number | null
          name: string
          qr_code_url?: string | null
          require_approval?: boolean | null
          storage_extended_until?: string | null
          updated_at?: string | null
          upload_code: string
        }
        Update: {
          allow_guest_view?: boolean | null
          auto_delete_date?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string
          guest_passcode_hash?: string | null
          host_id?: string
          id?: string
          is_public_gallery?: boolean | null
          location?: string | null
          max_photos?: number | null
          name?: string
          qr_code_url?: string | null
          require_approval?: boolean | null
          storage_extended_until?: string | null
          updated_at?: string | null
          upload_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          event_id: string
          file_size: number | null
          id: string
          is_approved: boolean | null
          original_filename: string | null
          storage_path: string
          thumbnail_path: string | null
          upload_ip: string | null
          uploaded_at: string | null
        }
        Insert: {
          event_id: string
          file_size?: number | null
          id?: string
          is_approved?: boolean | null
          original_filename?: string | null
          storage_path: string
          thumbnail_path?: string | null
          upload_ip?: string | null
          uploaded_at?: string | null
        }
        Update: {
          event_id?: string
          file_size?: number | null
          id?: string
          is_approved?: boolean | null
          original_filename?: string | null
          storage_path?: string
          thumbnail_path?: string | null
          upload_ip?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          events_allowed: number | null
          events_created: number | null
          full_name: string | null
          id: string
          is_host: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          events_allowed?: number | null
          events_created?: number | null
          full_name?: string | null
          id: string
          is_host?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          events_allowed?: number | null
          events_created?: number | null
          full_name?: string | null
          id?: string
          is_host?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_create_event: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      claim_host_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: undefined
      }
      event_allows_guest_view: {
        Args: { p_event_id: string }
        Returns: boolean
      }
      get_event_by_upload_code: {
        Args: { p_upload_code: string }
        Returns: {
          allow_guest_view: boolean
          description: string
          event_date: string
          id: string
          location: string
          max_photos: number
          name: string
          require_approval: boolean
        }[]
      }
      insert_photo: {
        Args: {
          p_event_id: string
          p_file_size: number
          p_original_filename: string
          p_storage_path: string
          p_upload_ip: string
        }
        Returns: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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

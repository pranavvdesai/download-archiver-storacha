// Database type definitions for Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
  public: {
    Tables: {
      users: {
        Row: {
          email: string
          user_id: string
          name: string
          avatar_url: string | null
          default_space_id: string | null
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: {
          email: string
          user_id?: string
          name: string
          avatar_url?: string | null
          default_space_id?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Update: {
          email?: string
          user_id?: string
          name?: string
          avatar_url?: string | null
          default_space_id?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          email: string
          rulesets: Json | null
          ocr_enabled: boolean
          max_file_size_for_ocr: number
          ocr_timeout: number
          default_file_visibility: string
          notification_preferences: Json | null
          updated_at: string
        }
        Insert: {
          email: string
          rulesets?: Json | null
          ocr_enabled?: boolean
          max_file_size_for_ocr?: number
          ocr_timeout?: number
          default_file_visibility?: string
          notification_preferences?: Json | null
          updated_at?: string
        }
        Update: {
          email?: string
          rulesets?: Json | null
          ocr_enabled?: boolean
          max_file_size_for_ocr?: number
          ocr_timeout?: number
          default_file_visibility?: string
          notification_preferences?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      spaces: {
        Row: {
          space_id: string
          name: string
          description: string | null
          visibility: string
          owner_email: string
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          space_id: string
          name: string
          description?: string | null
          visibility?: string
          owner_email: string
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          space_id?: string
          name?: string
          description?: string | null
          visibility?: string
          owner_email?: string
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      space_members: {
        Row: {
          id: string
          space_id: string
          user_email: string
          role: string
          joined_at: string
          last_active_at: string
          permissions: Json | null
        }
        Insert: {
          id?: string
          space_id: string
          user_email: string
          role?: string
          joined_at?: string
          last_active_at?: string
          permissions?: Json | null
        }
        Update: {
          id?: string
          space_id?: string
          user_email?: string
          role?: string
          joined_at?: string
          last_active_at?: string
          permissions?: Json | null
        }
        Relationships: []
      }
      files: {
        Row: {
          cid: string
          file_id: string
          space_id: string
          uploader_email: string
          name: string
          mime_type: string
          size_bytes: number
          file_kind: string
          visibility: string
          original_url: string | null
          source: string
          download_count: number
          shards: Json | null
          metadata: Json | null
          ocr_status: string
          ocr_text: string | null
          text_extraction_method: string | null
          processing_started_at: string | null
          processing_completed_at: string | null
          uploaded_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          cid: string
          file_id?: string
          space_id: string
          uploader_email: string
          name: string
          mime_type: string
          size_bytes: number
          file_kind?: string
          visibility?: string
          original_url?: string | null
          source?: string
          download_count?: number
          shards?: Json | null
          metadata?: Json | null
          ocr_status?: string
          ocr_text?: string | null
          text_extraction_method?: string | null
          processing_started_at?: string | null
          processing_completed_at?: string | null
          uploaded_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          cid?: string
          file_id?: string
          space_id?: string
          uploader_email?: string
          name?: string
          mime_type?: string
          size_bytes?: number
          file_kind?: string
          visibility?: string
          original_url?: string | null
          source?: string
          download_count?: number
          shards?: Json | null
          metadata?: Json | null
          ocr_status?: string
          ocr_text?: string | null
          text_extraction_method?: string | null
          processing_started_at?: string | null
          processing_completed_at?: string | null
          uploaded_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      file_tags: {
        Row: {
          id: string
          file_cid: string
          tag: string
          added_by_email: string
          added_at: string
        }
        Insert: {
          id?: string
          file_cid: string
          tag: string
          added_by_email: string
          added_at?: string
        }
        Update: {
          id?: string
          file_cid?: string
          tag?: string
          added_by_email?: string
          added_at?: string
        }
        Relationships: []
      }
      share_links: {
        Row: {
          share_id: string
          file_cid: string
          created_by_email: string
          share_token: string
          expires_at: string | null
          max_downloads: number | null
          download_count: number
          is_active: boolean
          password_hash: string | null
          allowed_emails: string[] | null
          metadata: Json | null
          created_at: string
          last_accessed_at: string | null
        }
        Insert: {
          share_id?: string
          file_cid: string
          created_by_email: string
          share_token: string
          expires_at?: string | null
          max_downloads?: number | null
          download_count?: number
          is_active?: boolean
          password_hash?: string | null
          allowed_emails?: string[] | null
          metadata?: Json | null
          created_at?: string
          last_accessed_at?: string | null
        }
        Update: {
          share_id?: string
          file_cid?: string
          created_by_email?: string
          share_token?: string
          expires_at?: string | null
          max_downloads?: number | null
          download_count?: number
          is_active?: boolean
          password_hash?: string | null
          allowed_emails?: string[] | null
          metadata?: Json | null
          created_at?: string
          last_accessed_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          event_id: string
          event_type: string
          user_email: string | null
          space_id: string | null
          file_cid: string | null
          payload: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          event_id?: string
          event_type: string
          user_email?: string | null
          space_id?: string | null
          file_cid?: string | null
          payload?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          user_email?: string | null
          space_id?: string | null
          file_cid?: string | null
          payload?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
      file_metrics_daily: {
        Row: {
          id: string
          file_cid: string
          metric_date: string
          downloads: number
          views: number
          shares: number
          bandwidth_bytes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          file_cid: string
          metric_date: string
          downloads?: number
          views?: number
          shares?: number
          bandwidth_bytes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          file_cid?: string
          metric_date?: string
          downloads?: number
          views?: number
          shares?: number
          bandwidth_bytes?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          session_id: string
          user_email: string
          created_at: string
          expires_at: string
          last_activity_at: string
          user_agent: string | null
          ip_address: string | null
          is_valid: boolean
          session_data: Json | null
        }
        Insert: {
          session_id?: string
          user_email: string
          created_at?: string
          expires_at: string
          last_activity_at?: string
          user_agent?: string | null
          ip_address?: string | null
          is_valid?: boolean
          session_data?: Json | null
        }
        Update: {
          session_id?: string
          user_email?: string
          created_at?: string
          expires_at?: string
          last_activity_at?: string
          user_agent?: string | null
          ip_address?: string | null
          is_valid?: boolean
          session_data?: Json | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

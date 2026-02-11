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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          center_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          center_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          center_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          center_id: string
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          center_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          center_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_settings_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          center_id: string | null
          content: string | null
          cover_image_url: string | null
          created_at: string | null
          excerpt: string | null
          id: string
          is_published: boolean | null
          keywords: string | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          center_id?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          keywords?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          center_id?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          keywords?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      centers: {
        Row: {
          address: string | null
          business_number: string | null
          created_at: string | null
          email: string | null
          holiday_text: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          naver_map_url: string | null
          phone: string | null
          representative: string | null
          saturday_hours: string | null
          slug: string | null
          updated_at: string | null
          weekday_hours: string | null
        }
        Insert: {
          address?: string | null
          business_number?: string | null
          created_at?: string | null
          email?: string | null
          holiday_text?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          naver_map_url?: string | null
          phone?: string | null
          representative?: string | null
          saturday_hours?: string | null
          slug?: string | null
          updated_at?: string | null
          weekday_hours?: string | null
        }
        Update: {
          address?: string | null
          business_number?: string | null
          created_at?: string | null
          email?: string | null
          holiday_text?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          naver_map_url?: string | null
          phone?: string | null
          representative?: string | null
          saturday_hours?: string | null
          slug?: string | null
          updated_at?: string | null
          weekday_hours?: string | null
        }
        Relationships: []
      }
      child_therapist: {
        Row: {
          child_id: string | null
          created_at: string | null
          end_date: string | null
          id: string
          is_primary: boolean | null
          service_type: string | null
          start_date: string | null
          therapist_id: string | null
        }
        Insert: {
          child_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_primary?: boolean | null
          service_type?: string | null
          start_date?: string | null
          therapist_id?: string | null
        }
        Update: {
          child_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_primary?: boolean | null
          service_type?: string | null
          start_date?: string | null
          therapist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "child_therapist_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_therapist_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          birth_date: string
          center_id: string | null
          contact: string | null
          created_at: string | null
          credit: number | null
          diagnosis: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          grade: string | null
          guardian_name: string | null
          id: string
          inflow_source: string | null
          invitation_code: string | null
          is_active: boolean | null
          medical_history: string | null
          name: string
          notes: string | null
          parent_id: string | null
          photo_url: string | null
          registration_number: string | null
          school_name: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date: string
          center_id?: string | null
          contact?: string | null
          created_at?: string | null
          credit?: number | null
          diagnosis?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          grade?: string | null
          guardian_name?: string | null
          id?: string
          inflow_source?: string | null
          invitation_code?: string | null
          is_active?: boolean | null
          medical_history?: string | null
          name: string
          notes?: string | null
          parent_id?: string | null
          photo_url?: string | null
          registration_number?: string | null
          school_name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string
          center_id?: string | null
          contact?: string | null
          created_at?: string | null
          credit?: number | null
          diagnosis?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          grade?: string | null
          guardian_name?: string | null
          id?: string
          inflow_source?: string | null
          invitation_code?: string | null
          is_active?: boolean | null
          medical_history?: string | null
          name?: string
          notes?: string | null
          parent_id?: string | null
          photo_url?: string | null
          registration_number?: string | null
          school_name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "children_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          center_id: string | null
          child_birth_date: string | null
          child_gender: Database["public"]["Enums"]["gender_type"] | null
          child_id: string | null
          child_name: string
          concern: string | null
          consultation_area: string[] | null
          created_at: string | null
          diagnosis: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relationship: string | null
          id: string
          inflow_source: string | null
          marketing_source: string | null
          notes: string | null
          preferred_class_schedule: string | null
          preferred_consult_schedule: string | null
          schedule_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          center_id?: string | null
          child_birth_date?: string | null
          child_gender?: Database["public"]["Enums"]["gender_type"] | null
          child_id?: string | null
          child_name: string
          concern?: string | null
          consultation_area?: string[] | null
          created_at?: string | null
          diagnosis?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id?: string
          inflow_source?: string | null
          marketing_source?: string | null
          notes?: string | null
          preferred_class_schedule?: string | null
          preferred_consult_schedule?: string | null
          schedule_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          center_id?: string | null
          child_birth_date?: string | null
          child_gender?: Database["public"]["Enums"]["gender_type"] | null
          child_id?: string | null
          child_name?: string
          concern?: string | null
          consultation_area?: string[] | null
          created_at?: string | null
          diagnosis?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id?: string
          inflow_source?: string | null
          marketing_source?: string | null
          notes?: string | null
          preferred_class_schedule?: string | null
          preferred_consult_schedule?: string | null
          schedule_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      counseling_logs: {
        Row: {
          activities: string | null
          center_id: string | null
          child_id: string | null
          child_response: string | null
          content: string | null
          created_at: string | null
          id: string
          next_plan: string | null
          parent_feedback: string | null
          schedule_id: string | null
          session_date: string
          therapist_id: string | null
          updated_at: string | null
        }
        Insert: {
          activities?: string | null
          center_id?: string | null
          child_id?: string | null
          child_response?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          next_plan?: string | null
          parent_feedback?: string | null
          schedule_id?: string | null
          session_date?: string
          therapist_id?: string | null
          updated_at?: string | null
        }
        Update: {
          activities?: string | null
          center_id?: string | null
          child_id?: string | null
          child_response?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          next_plan?: string | null
          parent_feedback?: string | null
          schedule_id?: string | null
          session_date?: string
          therapist_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counseling_logs_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counseling_logs_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counseling_logs_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_logs: {
        Row: {
          id: string
          schedule_id: string | null
        }
        Insert: {
          id?: string
          schedule_id?: string | null
        }
        Update: {
          id?: string
          schedule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      debug_logs: {
        Row: {
          created_at: string | null
          details: string | null
          id: number
          message: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: number
          message?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: number
          message?: string | null
        }
        Relationships: []
      }
      development_assessments: {
        Row: {
          assessment_data: Json | null
          assessment_details: Json | null
          center_id: string | null
          child_id: string | null
          content: Json | null
          counseling_log_id: string | null
          created_at: string | null
          evaluation_content: string | null
          evaluation_date: string
          id: string
          log_id: string | null
          score_adaptive: number | null
          score_cognitive: number | null
          score_communication: number | null
          score_motor: number | null
          score_social: number | null
          summary: string | null
          therapist_id: string | null
          therapist_notes: string | null
        }
        Insert: {
          assessment_data?: Json | null
          assessment_details?: Json | null
          center_id?: string | null
          child_id?: string | null
          content?: Json | null
          counseling_log_id?: string | null
          created_at?: string | null
          evaluation_content?: string | null
          evaluation_date?: string
          id?: string
          log_id?: string | null
          score_adaptive?: number | null
          score_cognitive?: number | null
          score_communication?: number | null
          score_motor?: number | null
          score_social?: number | null
          summary?: string | null
          therapist_id?: string | null
          therapist_notes?: string | null
        }
        Update: {
          assessment_data?: Json | null
          assessment_details?: Json | null
          center_id?: string | null
          child_id?: string | null
          content?: Json | null
          counseling_log_id?: string | null
          created_at?: string | null
          evaluation_content?: string | null
          evaluation_date?: string
          id?: string
          log_id?: string | null
          score_adaptive?: number | null
          score_cognitive?: number | null
          score_communication?: number | null
          score_motor?: number | null
          score_social?: number | null
          summary?: string | null
          therapist_id?: string | null
          therapist_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "da_children_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "da_therapists_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_assessments_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_assessments_counseling_log_id_fkey"
            columns: ["counseling_log_id"]
            isOneToOne: false
            referencedRelation: "counseling_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      family_relationships: {
        Row: {
          center_id: string | null
          child_id: string | null
          created_at: string | null
          id: string
          parent_id: string | null
          relationship: string | null
        }
        Insert: {
          center_id?: string | null
          child_id?: string | null
          created_at?: string | null
          id?: string
          parent_id?: string | null
          relationship?: string | null
        }
        Update: {
          center_id?: string | null
          child_id?: string | null
          created_at?: string | null
          id?: string
          parent_id?: string | null
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_relationships_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_relationships_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_relationships_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_relationships_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      home_care_tips: {
        Row: {
          category: string
          content: string
          created_at: string | null
          id: string
          title: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          id?: string
          title: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          center_id: string | null
          child_birth_year: number | null
          child_gender: Database["public"]["Enums"]["gender_type"] | null
          child_name: string | null
          concern: string | null
          converted_at: string | null
          converted_child_id: string | null
          converted_parent_id: string | null
          created_at: string | null
          email: string | null
          id: string
          parent_name: string
          phone: string
          preferred_service: string[] | null
          preferred_time: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          center_id?: string | null
          child_birth_year?: number | null
          child_gender?: Database["public"]["Enums"]["gender_type"] | null
          child_name?: string | null
          concern?: string | null
          converted_at?: string | null
          converted_child_id?: string | null
          converted_parent_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          parent_name: string
          phone: string
          preferred_service?: string[] | null
          preferred_time?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          center_id?: string | null
          child_birth_year?: number | null
          child_gender?: Database["public"]["Enums"]["gender_type"] | null
          child_name?: string | null
          concern?: string | null
          converted_at?: string | null
          converted_child_id?: string | null
          converted_parent_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          parent_name?: string
          phone?: string
          preferred_service?: string[] | null
          preferred_time?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_child_id_fkey"
            columns: ["converted_child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_stats: {
        Row: {
          center_id: string | null
          conversion_rate: number | null
          created_at: string | null
          date: string | null
          id: string
          new_leads: number | null
          total_visits: number | null
        }
        Insert: {
          center_id?: string | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          new_leads?: number | null
          total_visits?: number | null
        }
        Update: {
          center_id?: string | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          new_leads?: number | null
          total_visits?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_stats_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_observations: {
        Row: {
          center_id: string | null
          child_id: string | null
          content: string
          created_at: string | null
          id: string
          observation_date: string | null
          parent_id: string | null
        }
        Insert: {
          center_id?: string | null
          child_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          observation_date?: string | null
          parent_id?: string | null
        }
        Update: {
          center_id?: string | null
          child_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          observation_date?: string | null
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_observations_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_observations_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          center_id: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          profile_id: string | null
          updated_at: string | null
        }
        Insert: {
          center_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          profile_id?: string | null
          updated_at?: string | null
        }
        Update: {
          center_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          profile_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parents_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_items: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payment_id: string | null
          schedule_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payment_id?: string | null
          schedule_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payment_id?: string | null
          schedule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_items_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_items_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number | null
          center_id: string | null
          child_id: string | null
          created_at: string | null
          credit_used: number | null
          id: string
          memo: string | null
          method: string | null
          paid_at: string | null
          payment_month: string
        }
        Insert: {
          amount?: number | null
          center_id?: string | null
          child_id?: string | null
          created_at?: string | null
          credit_used?: number | null
          id?: string
          memo?: string | null
          method?: string | null
          paid_at?: string | null
          payment_month: string
        }
        Update: {
          amount?: number | null
          center_id?: string | null
          child_id?: string | null
          created_at?: string | null
          credit_used?: number | null
          id?: string
          memo?: string | null
          method?: string | null
          paid_at?: string | null
          payment_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          category: string | null
          center_id: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
        }
        Insert: {
          category?: string | null
          center_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
        }
        Update: {
          category?: string | null
          center_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number | null
          center_id: string | null
          color: string | null
          created_at: string | null
          equipment: string[] | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          capacity?: number | null
          center_id?: string | null
          color?: string | null
          created_at?: string | null
          equipment?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          capacity?: number | null
          center_id?: string | null
          color?: string | null
          created_at?: string | null
          equipment?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          cancellation_reason: string | null
          center_id: string | null
          child_id: string | null
          created_at: string | null
          created_by: string | null
          date: string | null
          end_time: string
          id: string
          is_recurring: boolean | null
          makeup_for_id: string | null
          notes: string | null
          parent_schedule_id: string | null
          program_id: string | null
          recurrence_rule: string | null
          room_id: string | null
          service_type: string | null
          session_no: number | null
          session_note: string | null
          start_time: string
          status: Database["public"]["Enums"]["schedule_status"] | null
          therapist_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          center_id?: string | null
          child_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          end_time: string
          id?: string
          is_recurring?: boolean | null
          makeup_for_id?: string | null
          notes?: string | null
          parent_schedule_id?: string | null
          program_id?: string | null
          recurrence_rule?: string | null
          room_id?: string | null
          service_type?: string | null
          session_no?: number | null
          session_note?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["schedule_status"] | null
          therapist_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          center_id?: string | null
          child_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          end_time?: string
          id?: string
          is_recurring?: boolean | null
          makeup_for_id?: string | null
          notes?: string | null
          parent_schedule_id?: string | null
          program_id?: string | null
          recurrence_rule?: string | null
          room_id?: string | null
          service_type?: string | null
          session_no?: number | null
          session_note?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["schedule_status"] | null
          therapist_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedules_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_makeup_for_id_fkey"
            columns: ["makeup_for_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_parent_schedule_id_fkey"
            columns: ["parent_schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visits: {
        Row: {
          center_id: string | null
          created_at: string | null
          id: string
          page_url: string | null
          referrer_url: string | null
          source_category: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visited_at: string | null
          visitor_id: string | null
        }
        Insert: {
          center_id?: string | null
          created_at?: string | null
          id?: string
          page_url?: string | null
          referrer_url?: string | null
          source_category?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visited_at?: string | null
          visitor_id?: string | null
        }
        Update: {
          center_id?: string | null
          created_at?: string | null
          id?: string
          page_url?: string | null
          referrer_url?: string | null
          source_category?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visited_at?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_visits_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      therapists: {
        Row: {
          account_holder: string | null
          account_number: string | null
          bank_name: string | null
          base_salary: number | null
          bio: string | null
          career: string | null
          center_id: string | null
          color: string | null
          consult_price: number | null
          contact: string | null
          created_at: string | null
          email: string | null
          evaluation_price: number | null
          hire_type: string | null
          hourly_rate: number | null
          id: string
          incentive_price: number | null
          is_active: boolean | null
          license_number: string | null
          license_type: string | null
          name: string
          phone: string | null
          profile_id: string | null
          profile_image: string | null
          remarks: string | null
          required_sessions: number | null
          session_price_weekday: number | null
          session_price_weekend: number | null
          sort_order: number | null
          specialization: string[] | null
          specialties: string | null
          system_role: string | null
          system_status: string | null
          updated_at: string | null
          website_visible: boolean | null
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          base_salary?: number | null
          bio?: string | null
          career?: string | null
          center_id?: string | null
          color?: string | null
          consult_price?: number | null
          contact?: string | null
          created_at?: string | null
          email?: string | null
          evaluation_price?: number | null
          hire_type?: string | null
          hourly_rate?: number | null
          id?: string
          incentive_price?: number | null
          is_active?: boolean | null
          license_number?: string | null
          license_type?: string | null
          name: string
          phone?: string | null
          profile_id?: string | null
          profile_image?: string | null
          remarks?: string | null
          required_sessions?: number | null
          session_price_weekday?: number | null
          session_price_weekend?: number | null
          sort_order?: number | null
          specialization?: string[] | null
          specialties?: string | null
          system_role?: string | null
          system_status?: string | null
          updated_at?: string | null
          website_visible?: boolean | null
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          base_salary?: number | null
          bio?: string | null
          career?: string | null
          center_id?: string | null
          color?: string | null
          consult_price?: number | null
          contact?: string | null
          created_at?: string | null
          email?: string | null
          evaluation_price?: number | null
          hire_type?: string | null
          hourly_rate?: number | null
          id?: string
          incentive_price?: number | null
          is_active?: boolean | null
          license_number?: string | null
          license_type?: string | null
          name?: string
          phone?: string | null
          profile_id?: string | null
          profile_image?: string | null
          remarks?: string | null
          required_sessions?: number | null
          session_price_weekday?: number | null
          session_price_weekend?: number | null
          sort_order?: number | null
          specialization?: string[] | null
          specialties?: string | null
          system_role?: string | null
          system_status?: string | null
          updated_at?: string | null
          website_visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "therapists_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          center_id: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string | null
          updated_at: string | null
        }
        Insert: {
          center_id?: string | null
          created_at?: string | null
          email: string
          id: string
          is_active?: boolean | null
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          center_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vouchers: {
        Row: {
          child_id: string | null
          created_at: string | null
          government_support: number | null
          id: string
          is_active: boolean | null
          notes: string | null
          remaining_sessions: number | null
          self_payment: number | null
          session_price: number | null
          total_sessions: number
          updated_at: string | null
          used_sessions: number | null
          valid_from: string
          valid_until: string
          voucher_number: string | null
          voucher_type: Database["public"]["Enums"]["voucher_type"]
        }
        Insert: {
          child_id?: string | null
          created_at?: string | null
          government_support?: number | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          remaining_sessions?: number | null
          self_payment?: number | null
          session_price?: number | null
          total_sessions: number
          updated_at?: string | null
          used_sessions?: number | null
          valid_from: string
          valid_until: string
          voucher_number?: string | null
          voucher_type: Database["public"]["Enums"]["voucher_type"]
        }
        Update: {
          child_id?: string | null
          created_at?: string | null
          government_support?: number | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          remaining_sessions?: number | null
          self_payment?: number | null
          session_price?: number | null
          total_sessions?: number
          updated_at?: string | null
          used_sessions?: number | null
          valid_from?: string
          valid_until?: string
          voucher_number?: string | null
          voucher_type?: Database["public"]["Enums"]["voucher_type"]
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles: {
        Row: {
          center_id: string | null
          created_at: string | null
          email: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          center_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          center_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_delete_center: {
        Args: { target_center_id: string }
        Returns: undefined
      }
      admin_delete_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      can_access_child_data: { Args: { child_id: string }; Returns: boolean }
      check_user_center: { Args: { row_center_id: string }; Returns: boolean }
      cleanup_ghost_users: {
        Args: never
        Returns: {
          deleted_email: string
          deleted_id: string
        }[]
      }
      connect_child_with_code: {
        Args: { p_code: string; p_parent_id: string }
        Returns: Json
      }
      force_cleanup_user_by_email: {
        Args: { target_email: string }
        Returns: undefined
      }
      generate_invitation_code: { Args: never; Returns: string }
      get_auth_email: { Args: never; Returns: string }
      get_my_center_id: { Args: never; Returns: string }
      get_my_center_id_safe: { Args: never; Returns: string }
      get_my_profile_info: {
        Args: never
        Returns: {
          center_id: string
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      get_my_role_safe: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_child_of_parent: { Args: { p_child_id: string }; Returns: boolean }
      is_manager: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_therapist: { Args: never; Returns: boolean }
      user_withdraw: { Args: never; Returns: undefined }
    }
    Enums: {
      gender_type: "male" | "female" | "other"
      lead_status: "new" | "contacted" | "scheduled" | "converted" | "cancelled"
      payment_status: "paid" | "unpaid" | "refunded" | "partial"
      payment_type: "voucher" | "general"
      schedule_status: "scheduled" | "completed" | "cancelled" | "makeup"
      user_role:
      | "admin"
      | "manager"
      | "therapist"
      | "parent"
      | "super_admin"
      | "staff"
      | "employee"
      | "super"
      voucher_type:
      | "developmental_voucher"
      | "language_voucher"
      | "emotional_voucher"
      | "general"
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
    Enums: {
      gender_type: ["male", "female", "other"],
      lead_status: ["new", "contacted", "scheduled", "converted", "cancelled"],
      payment_status: ["paid", "unpaid", "refunded", "partial"],
      payment_type: ["voucher", "general"],
      schedule_status: ["scheduled", "completed", "cancelled", "makeup"],
      user_role: [
        "admin",
        "manager",
        "therapist",
        "parent",
        "super_admin",
        "staff",
        "employee",
        "super",
      ],
      voucher_type: [
        "developmental_voucher",
        "language_voucher",
        "emotional_voucher",
        "general",
      ],
    },
  },
} as const

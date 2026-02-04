/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-10
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
    public: {
        Tables: {
            leads: {
                Row: {
                    id: string; center_id: string | null; parent_name: string; phone: string; email: string | null;
                    child_name: string | null; child_birth_year: number | null; child_gender: 'male' | 'female' | 'other' | null;
                    concern: string | null; preferred_service: string[] | null; preferred_time: string | null;
                    status: 'new' | 'contacted' | 'scheduled' | 'converted' | 'cancelled'; source: string | null;
                    converted_parent_id: string | null; converted_child_id: string | null; converted_at: string | null;
                    admin_notes: string | null; assigned_to: string | null; created_at: string; updated_at: string;
                }
                Insert: {
                    id?: string; center_id?: string | null; parent_name: string; phone: string; email?: string | null;
                    child_name?: string | null; child_birth_year?: number | null; child_gender?: 'male' | 'female' | 'other' | null;
                    concern?: string | null; preferred_service?: string[] | null; preferred_time?: string | null;
                    status?: 'new' | 'contacted' | 'scheduled' | 'converted' | 'cancelled'; source?: string | null;
                    converted_parent_id?: string | null; converted_child_id?: string | null; converted_at?: string | null;
                    admin_notes?: string | null; assigned_to?: string | null; created_at?: string; updated_at?: string;
                }
                Update: {
                    id?: string; center_id?: string | null; parent_name?: string; phone?: string; email?: string | null;
                    child_name?: string | null; child_birth_year?: number | null; child_gender?: 'male' | 'female' | 'other' | null;
                    concern?: string | null; preferred_service?: string[] | null; preferred_time?: string | null;
                    status?: 'new' | 'contacted' | 'scheduled' | 'converted' | 'cancelled'; source?: string | null;
                    converted_parent_id?: string | null; converted_child_id?: string | null; converted_at?: string | null;
                    admin_notes?: string | null; assigned_to?: string | null; created_at?: string; updated_at?: string;
                }
                Relationships: []
            }
            blog_posts: {
                Row: {
                    id: string; center_id: string | null; created_at: string; updated_at: string | null; title: string;
                    content: string; slug: string; excerpt: string | null; cover_image_url: string | null;
                    author_id: string | null; is_published: boolean; published_at: string | null;
                    seo_title: string | null; seo_description: string | null; keywords: string[] | null; view_count: number;
                }
                Insert: {
                    id?: string; center_id?: string | null; created_at?: string; updated_at?: string | null;
                    title: string; content: string; slug: string; excerpt?: string | null; cover_image_url?: string | null;
                    author_id?: string | null; is_published?: boolean; published_at?: string | null;
                    seo_title?: string | null; seo_description?: string | null; keywords?: string[] | null; view_count?: number;
                }
                Update: {
                    id?: string; center_id?: string | null; created_at?: string; updated_at?: string | null;
                    title?: string; content?: string; slug?: string; excerpt?: string | null; cover_image_url?: string | null;
                    author_id?: string | null; is_published?: boolean; published_at?: string | null;
                    seo_title?: string | null; seo_description?: string | null; keywords?: string[] | null; view_count?: number;
                }
                Relationships: []
            }
            centers: {
                Row: {
                    id: string; slug: string | null; name: string; address: string | null; phone: string | null;
                    email: string | null; business_number: string | null; representative: string | null;
                    logo_url: string | null; is_active: boolean | null; created_at: string; updated_at: string;
                }
                Insert: {
                    id?: string; slug?: string | null; name: string; address?: string | null; phone?: string | null;
                    email?: string | null; business_number?: string | null; representative?: string | null;
                    logo_url?: string | null; is_active?: boolean | null; created_at?: string; updated_at?: string;
                }
                Update: {
                    id?: string; slug?: string | null; name?: string; address?: string | null; phone?: string | null;
                    email?: string | null; business_number?: string | null; representative?: string | null;
                    logo_url?: string | null; is_active?: boolean | null; created_at?: string; updated_at?: string;
                }
                Relationships: []
            }
            user_profiles: {
                Row: {
                    id: string; center_id: string | null; email: string; name: string; phone: string | null;
                    role: 'admin' | 'manager' | 'therapist' | 'parent' | 'staff' | 'super' | 'super_admin';
                    avatar_url: string | null; status: string | null; is_active: boolean | null;
                    created_at: string; updated_at: string;
                }
                Insert: {
                    id: string; center_id?: string | null; email: string; name: string; phone?: string | null;
                    role?: 'admin' | 'manager' | 'therapist' | 'parent' | 'staff' | 'super' | 'super_admin';
                    avatar_url?: string | null; status?: string | null; is_active?: boolean | null;
                    created_at?: string; updated_at?: string;
                }
                Update: {
                    id?: string; center_id?: string | null; email?: string; name?: string; phone?: string | null;
                    role?: 'admin' | 'manager' | 'therapist' | 'parent' | 'staff' | 'super' | 'super_admin';
                    avatar_url?: string | null; status?: string | null; is_active?: boolean | null;
                    created_at?: string; updated_at?: string;
                }
                Relationships: []
            }
            therapists: {
                Row: {
                    id: string; profile_id: string | null; center_id: string | null; name: string; email: string | null;
                    phone: string | null; contact: string | null; specialization: string[] | null; license_number: string | null;
                    license_type: string | null; hourly_rate: number | null; color: string | null; bio: string | null;
                    career: string | null; specialties: string | null; profile_image: string | null;
                    website_visible: boolean | null; hire_type: string | null; system_role: string | null;
                    system_status: string | null; base_salary: number; required_sessions: number;
                    session_price_weekday: number; session_price_weekend: number; consult_price: number;
                    incentive_price: number; evaluation_price: number; remarks: string | null;
                    bank_name: string | null; account_number: string | null; account_holder: string | null;
                    is_active: boolean | null; created_at: string; updated_at: string;
                }
                Insert: {
                    id?: string; profile_id?: string | null; center_id?: string | null; name: string; email?: string | null;
                    phone?: string | null; contact?: string | null; specialization?: string[] | null; license_number?: string | null;
                    license_type?: string | null; hourly_rate?: number | null; color?: string | null; bio?: string | null;
                    career?: string | null; specialties?: string | null; profile_image?: string | null;
                    website_visible?: boolean | null; hire_type?: string | null; system_role?: string | null;
                    system_status?: string | null; base_salary?: number; required_sessions?: number;
                    session_price_weekday?: number; session_price_weekend?: number; consult_price?: number;
                    incentive_price?: number; evaluation_price?: number; remarks?: string | null;
                    bank_name?: string | null; account_number?: string | null; account_holder?: string | null;
                    is_active?: boolean | null; created_at?: string; updated_at?: string;
                }
                Update: {
                    id?: string; profile_id?: string | null; center_id?: string | null; name?: string; email?: string | null;
                    phone?: string | null; contact?: string | null; specialization?: string[] | null; license_number?: string | null;
                    license_type?: string | null; hourly_rate?: number | null; color?: string | null; bio?: string | null;
                    career?: string | null; specialties?: string | null; profile_image?: string | null;
                    website_visible?: boolean | null; hire_type?: string | null; system_role?: string | null;
                    system_status?: string | null; base_salary?: number; required_sessions?: number;
                    session_price_weekday?: number; session_price_weekend?: number; consult_price?: number;
                    incentive_price?: number; evaluation_price?: number; remarks?: string | null;
                    bank_name?: string | null; account_number?: string | null; account_holder?: string | null;
                    is_active?: boolean | null; created_at?: string; updated_at?: string;
                }
                Relationships: []
            }
            parents: {
                Row: {
                    id: string; profile_id: string | null; center_id: string | null; name: string; phone: string;
                    email: string | null; address: string | null; status: string | null; created_at: string; updated_at: string;
                }
                Insert: {
                    id?: string; profile_id?: string | null; center_id?: string | null; name: string; phone: string;
                    email?: string | null; address?: string | null; status?: string | null; created_at?: string; updated_at?: string;
                }
                Update: {
                    id?: string; profile_id?: string | null; center_id?: string | null; name?: string; phone?: string;
                    email?: string | null; address?: string | null; status?: string | null; created_at?: string; updated_at?: string;
                }
                Relationships: []
            }
            children: {
                Row: {
                    id: string; center_id: string | null; parent_id: string | null; name: string; birth_date: string;
                    gender: 'male' | 'female' | 'other' | null; school_name: string | null; grade: string | null;
                    diagnosis: string | null; medical_history: string | null; notes: string | null; photo_url: string | null;
                    is_active: boolean | null; created_at: string; updated_at: string;
                }
                Insert: {
                    id?: string; center_id?: string | null; parent_id?: string | null; name: string; birth_date: string;
                    gender?: 'male' | 'female' | 'other' | null; school_name?: string | null; grade?: string | null;
                    diagnosis?: string | null; medical_history?: string | null; notes?: string | null; photo_url?: string | null;
                    is_active?: boolean | null; created_at?: string; updated_at?: string;
                }
                Update: {
                    id?: string; center_id?: string | null; parent_id?: string | null; name?: string; birth_date?: string;
                    gender?: 'male' | 'female' | 'other' | null; school_name?: string | null; grade?: string | null;
                    diagnosis?: string | null; medical_history?: string | null; notes?: string | null; photo_url?: string | null;
                    is_active?: boolean | null; created_at?: string; updated_at?: string;
                }
                Relationships: []
            }
            schedules: {
                Row: {
                    id: string; center_id: string | null; child_id: string | null; therapist_id: string | null;
                    room_id: string | null; title: string | null; service_type: string | null; start_time: string;
                    end_time: string; status: 'scheduled' | 'completed' | 'cancelled' | 'makeup' | 'carried_over' | null;
                    is_recurring: boolean | null; recurrence_rule: string | null; created_at: string; updated_at: string;
                }
                Insert: {
                    id?: string; center_id?: string | null; child_id?: string | null; therapist_id?: string | null;
                    room_id?: string | null; title?: string | null; service_type?: string | null; start_time: string;
                    end_time: string; status?: 'scheduled' | 'completed' | 'cancelled' | 'makeup' | 'carried_over' | null;
                    is_recurring?: boolean | null; recurrence_rule?: string | null; created_at?: string; updated_at?: string;
                }
                Update: {
                    id?: string; center_id?: string | null; child_id?: string | null; therapist_id?: string | null;
                    room_id?: string | null; title?: string | null; service_type?: string | null; start_time?: string;
                    end_time?: string; status?: 'scheduled' | 'completed' | 'cancelled' | 'makeup' | 'carried_over' | null;
                    is_recurring?: boolean | null; recurrence_rule?: string | null; created_at?: string; updated_at?: string;
                }
                Relationships: []
            }
        }
        Views: { [_ in never]: never }
        Functions: { [_ in never]: never }
        Enums: { gender_type: 'male' | 'female' | 'other' }
    }
}

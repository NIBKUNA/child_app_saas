/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-02-04
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
    public: {
        Tables: {
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
                    role: 'admin' | 'manager' | 'therapist' | 'parent' | 'super_admin';
                    avatar_url: string | null; status: string | null; is_active: boolean | null;
                    created_at: string; updated_at: string;
                }
                Insert: {
                    id: string; center_id?: string | null; email: string; name: string; phone?: string | null;
                    role?: 'admin' | 'manager' | 'therapist' | 'parent' | 'super_admin';
                    avatar_url?: string | null; status?: string | null; is_active?: boolean | null;
                    created_at?: string; updated_at?: string;
                }
                Update: {
                    id?: string; center_id?: string | null; email?: string; name?: string; phone?: string | null;
                    role?: 'admin' | 'manager' | 'therapist' | 'parent' | 'super_admin';
                    avatar_url?: string | null; status?: string | null; is_active?: boolean | null;
                    created_at?: string; updated_at?: string;
                }
                Relationships: [
                    {
                        foreignKeyName: "user_profiles_center_id_fkey"
                        columns: ["center_id"]
                        referencedRelation: "centers"
                        referencedColumns: ["id"]
                    }
                ]
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
                Relationships: [
                    {
                        foreignKeyName: "therapists_center_id_fkey"
                        columns: ["center_id"]
                        referencedRelation: "centers"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "therapists_profile_id_fkey"
                        columns: ["profile_id"]
                        referencedRelation: "user_profiles"
                        referencedColumns: ["id"]
                    }
                ]
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
                    gender: 'male' | 'female' | 'other' | null; diagnosis: string | null; created_at: string; updated_at: string;
                }
                Insert: {
                    id?: string; center_id?: string | null; parent_id?: string | null; name: string; birth_date: string;
                    gender?: 'male' | 'female' | 'other' | null; diagnosis?: string | null; created_at?: string; updated_at?: string;
                }
                Update: {
                    id?: string; center_id?: string | null; parent_id?: string | null; name?: string; birth_date?: string;
                    gender?: 'male' | 'female' | 'other' | null; diagnosis?: string | null; created_at?: string; updated_at?: string;
                }
                Relationships: []
            }
            schedules: {
                Row: {
                    id: string; center_id: string | null; child_id: string | null; therapist_id: string | null;
                    start_time: string; end_time: string; service_type: string | null; status: string | null; created_at: string;
                }
                Insert: {
                    id?: string; center_id?: string | null; child_id?: string | null; therapist_id?: string | null;
                    start_time: string; end_time: string; status?: string | null; created_at?: string;
                }
                Update: {
                    id?: string; center_id?: string | null; child_id?: string | null; therapist_id?: string | null;
                    start_time?: string; end_time?: string; status?: string | null; created_at?: string;
                }
                Relationships: []
            }
            leads: {
                Row: { id: string; parent_name: string; phone: string; status: string; created_at: string }
                Insert: { id?: string; parent_name: string; phone: string; status?: string; created_at?: string }
                Update: { id?: string; parent_name?: string; phone?: string; status?: string; created_at?: string }
                Relationships: []
            }
            consultations: {
                Row: { id: string; child_name: string; status: string; created_at: string }
                Insert: { id?: string; child_name: string; status?: string; created_at?: string }
                Update: { id?: string; child_name?: string; status?: string; created_at?: string }
                Relationships: []
            }
            payments: {
                Row: { id: string; child_id: string; amount: number; paid_at: string }
                Insert: { id?: string; child_id: string; amount: number; paid_at: string }
                Update: { id?: string; child_id?: string; amount?: number; paid_at?: string }
                Relationships: []
            }
            admin_notifications: {
                Row: { id: string; user_id: string; type: string; message: string; is_read: boolean; created_at: string }
                Insert: { id?: string; user_id: string; type: string; message: string; is_read?: boolean; created_at?: string }
                Update: { id?: string; user_id?: string; type?: string; message?: string; is_read?: boolean; created_at?: string }
                Relationships: []
            }
        }
        Views: { [_ in never]: never }
        Functions: { [_ in never]: never }
        Enums: { gender_type: 'male' | 'female' | 'other' }
    }
}

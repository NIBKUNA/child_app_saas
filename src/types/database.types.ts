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
            leads: {
                Row: {
                    id: string
                    center_id: string | null
                    parent_name: string
                    phone: string
                    email: string | null
                    child_name: string | null
                    child_birth_year: number | null
                    child_gender: 'male' | 'female' | 'other' | null
                    concern: string | null
                    preferred_service: string[] | null
                    preferred_time: string | null
                    status: 'new' | 'contacted' | 'scheduled' | 'converted' | 'cancelled'
                    source: string | null
                    converted_parent_id: string | null
                    converted_child_id: string | null
                    converted_at: string | null
                    admin_notes: string | null
                    assigned_to: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    center_id?: string | null
                    parent_name: string
                    phone: string
                    email?: string | null
                    child_name?: string | null
                    child_birth_year?: number | null
                    child_gender?: 'male' | 'female' | 'other' | null
                    concern?: string | null
                    preferred_service?: string[] | null
                    preferred_time?: string | null
                    status?: 'new' | 'contacted' | 'scheduled' | 'converted' | 'cancelled'
                    source?: string | null
                    converted_parent_id?: string | null
                    converted_child_id?: string | null
                    converted_at?: string | null
                    admin_notes?: string | null
                    assigned_to?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    center_id?: string | null
                    parent_name?: string
                    phone?: string
                    email?: string | null
                    child_name?: string | null
                    child_birth_year?: number | null
                    child_gender?: 'male' | 'female' | 'other' | null
                    concern?: string | null
                    preferred_service?: string[] | null
                    preferred_time?: string | null
                    status?: 'new' | 'contacted' | 'scheduled' | 'converted' | 'cancelled'
                    source?: string | null
                    converted_parent_id?: string | null
                    converted_child_id?: string | null
                    converted_at?: string | null
                    admin_notes?: string | null
                    assigned_to?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            centers: {
                Row: {
                    id: string
                    name: string
                    address: string | null
                    phone: string | null
                    email: string | null
                    business_number: string | null
                    representative: string | null
                    logo_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    address?: string | null
                    phone?: string | null
                    email?: string | null
                    business_number?: string | null
                    representative?: string | null
                    logo_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    address?: string | null
                    phone?: string | null
                    email?: string | null
                    business_number?: string | null
                    representative?: string | null
                    logo_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            profiles: {
                Row: {
                    id: string
                    center_id: string | null
                    email: string
                    name: string
                    phone: string | null
                    role: 'admin' | 'manager' | 'therapist' | 'parent'
                    avatar_url: string | null
                    is_active: boolean | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    center_id?: string | null
                    email: string
                    name: string
                    phone?: string | null
                    role?: 'admin' | 'manager' | 'therapist' | 'parent'
                    avatar_url?: string | null
                    is_active?: boolean | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    center_id?: string | null
                    email?: string
                    name?: string
                    phone?: string | null
                    role?: 'admin' | 'manager' | 'therapist' | 'parent'
                    avatar_url?: string | null
                    is_active?: boolean | null
                    created_at?: string
                    updated_at?: string
                }
            }
            parents: {
                Row: {
                    id: string
                    profile_id: string | null
                    center_id: string | null
                    name: string
                    phone: string
                    email: string | null
                    address: string | null
                    emergency_contact: string | null
                    relationship: string | null
                    notes: string | null
                    referral_source: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    profile_id?: string | null
                    center_id?: string | null
                    name: string
                    phone: string
                    email?: string | null
                    address?: string | null
                    emergency_contact?: string | null
                    relationship?: string | null
                    notes?: string | null
                    referral_source?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    profile_id?: string | null
                    center_id?: string | null
                    name?: string
                    phone?: string
                    email?: string | null
                    address?: string | null
                    emergency_contact?: string | null
                    relationship?: string | null
                    notes?: string | null
                    referral_source?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            therapists: {
                Row: {
                    id: string
                    profile_id: string | null
                    center_id: string | null
                    name: string
                    email: string | null
                    phone: string | null
                    specialization: string[] | null
                    license_number: string | null
                    license_type: string | null
                    hourly_rate: number | null
                    color: string | null
                    bio: string | null
                    is_active: boolean | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    profile_id?: string | null
                    center_id?: string | null
                    name: string
                    email?: string | null
                    phone?: string | null
                    specialization?: string[] | null
                    license_number?: string | null
                    license_type?: string | null
                    hourly_rate?: number | null
                    color?: string | null
                    bio?: string | null
                    is_active?: boolean | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    profile_id?: string | null
                    center_id?: string | null
                    name?: string
                    email?: string | null
                    phone?: string | null
                    specialization?: string[] | null
                    license_number?: string | null
                    license_type?: string | null
                    hourly_rate?: number | null
                    color?: string | null
                    bio?: string | null
                    is_active?: boolean | null
                    created_at?: string
                    updated_at?: string
                }
            }
            children: {
                Row: {
                    id: string
                    center_id: string | null
                    parent_id: string | null
                    name: string
                    birth_date: string
                    gender: 'male' | 'female' | 'other' | null
                    school_name: string | null
                    grade: string | null
                    diagnosis: string | null
                    medical_history: string | null
                    notes: string | null
                    photo_url: string | null
                    is_active: boolean | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    center_id?: string | null
                    parent_id?: string | null
                    name: string
                    birth_date: string
                    gender?: 'male' | 'female' | 'other' | null
                    school_name?: string | null
                    grade?: string | null
                    diagnosis?: string | null
                    medical_history?: string | null
                    notes?: string | null
                    photo_url?: string | null
                    is_active?: boolean | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    center_id?: string | null
                    parent_id?: string | null
                    name?: string
                    birth_date?: string
                    gender?: 'male' | 'female' | 'other' | null
                    school_name?: string | null
                    grade?: string | null
                    diagnosis?: string | null
                    medical_history?: string | null
                    notes?: string | null
                    photo_url?: string | null
                    is_active?: boolean | null
                    created_at?: string
                    updated_at?: string
                }
            }
            schedules: {
                Row: {
                    id: string
                    center_id: string | null
                    child_id: string | null
                    therapist_id: string | null
                    room_id: string | null
                    title: string | null
                    service_type: string | null
                    start_time: string
                    end_time: string
                    status: 'scheduled' | 'completed' | 'cancelled' | 'makeup' | 'carried_over' | null
                    is_recurring: boolean | null
                    recurrence_rule: string | null
                    parent_schedule_id: string | null
                    cancellation_reason: string | null
                    makeup_for_id: string | null
                    notes: string | null
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    center_id?: string | null
                    child_id?: string | null
                    therapist_id?: string | null
                    room_id?: string | null
                    title?: string | null
                    service_type?: string | null
                    start_time: string
                    end_time: string
                    status?: 'scheduled' | 'completed' | 'cancelled' | 'makeup' | 'carried_over' | null
                    is_recurring?: boolean | null
                    recurrence_rule?: string | null
                    parent_schedule_id?: string | null
                    cancellation_reason?: string | null
                    makeup_for_id?: string | null
                    notes?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    center_id?: string | null
                    child_id?: string | null
                    therapist_id?: string | null
                    room_id?: string | null
                    title?: string | null
                    service_type?: string | null
                    start_time?: string
                    end_time?: string
                    status?: 'scheduled' | 'completed' | 'cancelled' | 'makeup' | 'carried_over' | null
                    is_recurring?: boolean | null
                    recurrence_rule?: string | null
                    parent_schedule_id?: string | null
                    cancellation_reason?: string | null
                    makeup_for_id?: string | null
                    notes?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            counseling_logs: {
                Row: {
                    id: string
                    child_id: string | null
                    therapist_id: string | null
                    schedule_id: string | null
                    session_date: string
                    session_number: number | null
                    duration_minutes: number | null
                    objectives: string | null
                    activities: string | null
                    observations: string | null
                    child_response: string | null
                    next_plan: string | null
                    parent_feedback: string | null
                    attachments: string[] | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    child_id?: string | null
                    therapist_id?: string | null
                    schedule_id?: string | null
                    session_date: string
                    session_number?: number | null
                    duration_minutes?: number | null
                    objectives?: string | null
                    activities?: string | null
                    observations?: string | null
                    child_response?: string | null
                    next_plan?: string | null
                    parent_feedback?: string | null
                    attachments?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    child_id?: string | null
                    therapist_id?: string | null
                    schedule_id?: string | null
                    session_date?: string
                    session_number?: number | null
                    duration_minutes?: number | null
                    objectives?: string | null
                    activities?: string | null
                    observations?: string | null
                    child_response?: string | null
                    next_plan?: string | null
                    parent_feedback?: string | null
                    attachments?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
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
    }
}

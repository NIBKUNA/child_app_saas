-- 🔧 [URGENT] Fix Therapists Table Schema & RLS for Payroll
-- 1. missing columns: remarks, system_role, system_status (assurance)
-- 2. RLS policy to allow Admins to update therapists data (salary info)

BEGIN;

-- 1. Add missing columns to therapists table
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS remarks text;
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS system_role text DEFAULT 'therapist';
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS system_status text DEFAULT 'active';
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS contact text;

-- 2. Fix RLS for therapists table
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;

-- (A) Everyone/Authenticated can read (for list display)
DROP POLICY IF EXISTS "Allow public read access" ON public.therapists;
DROP POLICY IF EXISTS "p_therapists_read_all" ON public.therapists;
CREATE POLICY "p_therapists_read_all" ON public.therapists
    FOR SELECT USING (true);

-- (B) Admins can update all details (salary, hire_type, etc.)
DROP POLICY IF EXISTS "Admins can update all therapist info" ON public.therapists;
CREATE POLICY "Admins can update all therapist info" 
    ON public.therapists FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- (C) Admins can insert/delete (Manage staff)
DROP POLICY IF EXISTS "Admins can manage therapists" ON public.therapists;
CREATE POLICY "Admins can manage therapists" 
    ON public.therapists FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

COMMIT;

SELECT '✅ Therapists schema and RLS policies updated successfully.' as status;

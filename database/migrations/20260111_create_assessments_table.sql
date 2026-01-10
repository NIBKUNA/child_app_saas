-- ============================================================
-- 1. Create development_assessments table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.development_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- 5 Developmental Domains (Scores 1-5 or 1-100)
    score_communication INTEGER CHECK (score_communication >= 0),
    score_social INTEGER CHECK (score_social >= 0),
    score_cognitive INTEGER CHECK (score_cognitive >= 0),
    score_motor INTEGER CHECK (score_motor >= 0),
    score_adaptive INTEGER CHECK (score_adaptive >= 0),

    summary TEXT, -- Qualitative assessment
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. Enable RLS
-- ============================================================
ALTER TABLE public.development_assessments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. RLS Policies
-- ============================================================

-- A. Therapist Access: Can insert/view if they have a schedule with the child OR created it
-- For simplicity and performance, we'll allow therapists to view assessments for children they are linked to via schedules.
-- Or more simply: Therapists can see assessments where they are the author, OR for children they teach.

-- Policy: Therapists can VIEW assessments for children they have schedules with
CREATE POLICY "Therapists can view assessments for their students" ON public.development_assessments
FOR SELECT TO authenticated
USING (
    child_id IN (
        SELECT child_id FROM public.schedules WHERE therapist_id = auth.uid()
    )
    OR
    therapist_id = auth.uid()
);

-- Policy: Therapists can INSERT assessments linked to themselves
CREATE POLICY "Therapists can create assessments" ON public.development_assessments
FOR INSERT TO authenticated
WITH CHECK (
    therapist_id = auth.uid()
);

-- Policy: Therapists can UPDATE their own assessments
CREATE POLICY "Therapists can update own assessments" ON public.development_assessments
FOR UPDATE TO authenticated
USING (therapist_id = auth.uid());

-- Policy: Therapists can DELETE their own assessments
CREATE POLICY "Therapists can delete own assessments" ON public.development_assessments
FOR DELETE TO authenticated
USING (therapist_id = auth.uid());

-- B. Parents Access: Can VIEW assessments for their own children
CREATE POLICY "Parents can view own child assessments" ON public.development_assessments
FOR SELECT TO authenticated
USING (
    child_id IN (
        SELECT id FROM public.children WHERE parent_id = auth.uid()
    )
);

-- C. Super Admin / Admin Access
CREATE POLICY "Admins can do everything" ON public.development_assessments
FOR ALL TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
    OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- ============================================================
-- 4. Grant Permissions
-- ============================================================
GRANT ALL ON public.development_assessments TO authenticated;
GRANT ALL ON public.development_assessments TO service_role;

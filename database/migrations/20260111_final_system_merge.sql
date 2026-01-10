-- ============================================================
-- 🛠️ FINAL SYSTEM MERGE: Growth Report & Integrity
-- 📅 Date: 2026-01-11
-- 👨‍💻 Developer: 안욱빈 (An Uk-bin)
-- ============================================================

-- 1. Table Schema: Development Assessments
-- Stores 5-domain scores plus detailed evidence (JSONB)
CREATE TABLE IF NOT EXISTS public.development_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    log_id UUID REFERENCES public.counseling_logs(id) ON DELETE SET NULL, -- Traceability
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Scoring (1-5 Scale)
    score_communication INTEGER CHECK (score_communication >= 0),
    score_social INTEGER CHECK (score_social >= 0),
    score_cognitive INTEGER CHECK (score_cognitive >= 0),
    score_motor INTEGER CHECK (score_motor >= 0),
    score_adaptive INTEGER CHECK (score_adaptive >= 0),

    summary TEXT,
    assessment_details JSONB DEFAULT '{}'::jsonb, -- Detailed Checklist Evidence

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Performance & Integrity: Indexes & Triggers
CREATE INDEX IF NOT EXISTS idx_assessments_child ON public.development_assessments(child_id);
CREATE INDEX IF NOT EXISTS idx_assessments_therapist ON public.development_assessments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_assessments_date ON public.development_assessments(evaluation_date DESC);

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_development_assessments_updated_at ON public.development_assessments;
CREATE TRIGGER update_development_assessments_updated_at
    BEFORE UPDATE ON public.development_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Security: Zero-Dependency RLS Policies
ALTER TABLE public.development_assessments ENABLE ROW LEVEL SECURITY;

-- Policy: Therapists View (Own creations OR Linked Students)
-- Uses direct subquery to 'schedules' for performance (avoiding complex joins in policy if possible, but schedules is necessary here)
CREATE POLICY "Therapists: View Linked Assessments" ON public.development_assessments
FOR SELECT TO authenticated
USING (
    therapist_id = auth.uid() OR
    child_id IN (SELECT child_id FROM public.schedules WHERE therapist_id = auth.uid())
);

-- Policy: Therapists Create/Edit (Own only)
CREATE POLICY "Therapists: Manage Own Assessments" ON public.development_assessments
FOR ALL TO authenticated
USING (therapist_id = auth.uid())
WITH CHECK (therapist_id = auth.uid());

-- Policy: Parents View (Own Children)
-- Uses direct subquery to 'children'
CREATE POLICY "Parents: View Own Child Reports" ON public.development_assessments
FOR SELECT TO authenticated
USING (
    child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid())
);

-- Policy: Admins Full Access
CREATE POLICY "Admins: Full Access" ON public.development_assessments
FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 4. Final Permissions
GRANT ALL ON public.development_assessments TO authenticated;
GRANT ALL ON public.development_assessments TO service_role;

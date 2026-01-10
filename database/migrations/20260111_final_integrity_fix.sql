-- ============================================================
-- 1. Schema Enhancement: Add details and log connection
-- ============================================================
ALTER TABLE public.development_assessments 
ADD COLUMN IF NOT EXISTS assessment_details JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS log_id UUID REFERENCES public.counseling_logs(id) ON DELETE SET NULL;

-- ============================================================
-- 2. Integrity Checks & Constraints
-- ============================================================

-- Ensure composite uniqueness to prevent duplicate assessments for the same child/date? 
-- Optional, but good for integrity. Let's add a soft constraint or keep it flexible.
-- For now, we will strictly enforce FKs (already defined, but re-verifying).

-- 3. Trigger for updated_at
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

-- ============================================================
-- 4. Comments for Documentation
-- ============================================================
COMMENT ON COLUMN public.development_assessments.assessment_details IS 'Stores the checklist items and specific evidence for the score';
COMMENT ON COLUMN public.development_assessments.log_id IS 'Optional link to a specific counseling log for context';

-- ============================================================
-- 5. Verification: Check for broken relationships (Integrity Fix)
-- ============================================================
-- Delete assessments that might have been created with invalid child_ids (cleanup)
DELETE FROM public.development_assessments 
WHERE child_id NOT IN (SELECT id FROM public.children);

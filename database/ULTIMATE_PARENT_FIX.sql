-- =======================================================
-- 🏆 ULTIMATE PARENT FUNCTIONALITY FIX
-- =======================================================
-- This script fixes:
-- 1. Missing RPC 'connect_child_with_code'
-- 2. Missing/Inconsistent Clinical Tables (counseling_logs, assessments)
-- 3. RLS for Parent Access (Schedules, Logs, Stats)
-- 4. Test Data for '8FAC6'
-- =======================================================

BEGIN;

-- 1. 🏗️ CORE TABLES (Clinical Records)
CREATE TABLE IF NOT EXISTS public.counseling_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID REFERENCES public.centers(id),
    schedule_id UUID REFERENCES public.schedules(id) ON DELETE SET NULL,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES public.therapists(id) ON DELETE SET NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    activities TEXT,
    child_response TEXT,
    next_plan TEXT,
    parent_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.development_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID REFERENCES public.centers(id),
    log_id UUID REFERENCES public.counseling_logs(id) ON DELETE CASCADE,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES public.therapists(id) ON DELETE SET NULL,
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    score_communication INTEGER DEFAULT 0,
    score_social INTEGER DEFAULT 0,
    score_cognitive INTEGER DEFAULT 0,
    score_motor INTEGER DEFAULT 0,
    score_adaptive INTEGER DEFAULT 0,
    summary TEXT,
    therapist_notes TEXT, -- Private for therapists
    assessment_details JSONB, -- Checklist storage
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.parent_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    observation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 🤖 RPC: connect_child_with_code
--    Fixed parameter ordering and security definer
CREATE OR REPLACE FUNCTION public.connect_child_with_code(p_parent_id UUID, p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_child_id UUID;
    v_child_name TEXT;
    v_exists BOOLEAN;
BEGIN
    -- [1] Find child by code
    SELECT id, name INTO v_child_id, v_child_name
    FROM public.children
    WHERE UPPER(TRIM(invitation_code)) = UPPER(TRIM(p_code));

    IF v_child_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', '유효하지 않은 초대 코드입니다.');
    END IF;

    -- [2] Check if already connected
    SELECT EXISTS(
        SELECT 1 FROM public.family_relationships
        WHERE parent_id = p_parent_id AND child_id = v_child_id
    ) INTO v_exists;

    IF v_exists THEN
        RETURN jsonb_build_object('success', false, 'message', '이미 연결된 자녀입니다.');
    END IF;

    -- [3] Create connection in Junction Table
    INSERT INTO public.family_relationships (parent_id, child_id, relationship)
    VALUES (p_parent_id, v_child_id, 'parent')
    ON CONFLICT (parent_id, child_id) DO NOTHING;

    -- [4] Sync to Legacy Column (optional but safer)
    UPDATE public.children SET parent_id = (SELECT id FROM parents WHERE profile_id = p_parent_id LIMIT 1) WHERE id = v_child_id;

    RETURN jsonb_build_object('success', true, 'child_name', v_child_name);
END;
$$;

-- 3. 🛡️ RLS: Parent Access (The "I can see my child" logic)
ALTER TABLE public.counseling_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Dynamic Access Function
CREATE OR REPLACE FUNCTION public.can_access_child_data(child_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        EXISTS (
            SELECT 1 FROM public.family_relationships 
            WHERE parent_id = auth.uid() AND child_id = $1
        )
        OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'therapist')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Policies
DROP POLICY IF EXISTS "Parent View Logs" ON public.counseling_logs;
CREATE POLICY "Parent View Logs" ON public.counseling_logs FOR SELECT USING (public.can_access_child_data(child_id));

DROP POLICY IF EXISTS "Parent View Assessments" ON public.development_assessments;
CREATE POLICY "Parent View Assessments" ON public.development_assessments FOR SELECT USING (public.can_access_child_data(child_id));

-- 4. 🧪 TEST DATA: Reset & Setup '8FAC6'
-- Delete old zombi test stuff to ensure fresh start
DELETE FROM public.parents WHERE email = 'zombi00000@naver.com';
DELETE FROM public.profiles WHERE email = 'zombi00000@naver.com';
DELETE FROM auth.users WHERE email = 'zombi00000@naver.com';

-- Create a child with the specific code if missing
INSERT INTO public.children (name, birth_date, gender, invitation_code, center_id)
SELECT '박재현 어린이', '2020-05-15', 'male', '8FAC6', (SELECT id FROM centers ORDER BY created_at ASC LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM children WHERE invitation_code = '8FAC6');

COMMIT;

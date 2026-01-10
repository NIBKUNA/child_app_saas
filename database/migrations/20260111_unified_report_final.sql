-- ============================================================
-- 📊 Unified Center Report View
-- 📅 Date: 2026-01-11
-- 👨‍💻 Developer: 안욱빈 (An Uk-bin)
-- Description: Consolidated view for reporting purposes.
-- ============================================================

CREATE OR REPLACE VIEW public.unified_center_report_view AS
SELECT
    c.id AS child_id,
    c.name AS child_name,
    c.gender,
    c.birth_date,
    c.is_active,
    c.created_at AS registration_date,
    
    -- Parent Info
    up.name AS parent_name,
    up.phone AS parent_phone,
    up.email AS parent_email,

    -- Assessment Scores (Latest)
    da.evaluation_date,
    da.summary,
    da.score_communication,
    da.score_social,
    da.score_cognitive,
    da.score_motor,
    da.score_adaptive,
    
    -- Evidence (JSONB cast to text for export)
    da.assessment_details::text AS assessment_details_raw

FROM public.children c
LEFT JOIN public.profiles up ON c.parent_id = up.id
LEFT JOIN LATERAL (
    SELECT * FROM public.development_assessments
    WHERE child_id = c.id
    ORDER BY evaluation_date DESC
    LIMIT 1
) da ON true;

-- Grant Access
GRANT SELECT ON public.unified_center_report_view TO authenticated;

-- 🛠️ [Verification] Insert Dummy Data (Safe Mode)
DO $$
DECLARE
    v_user_id UUID;
    v_child_id UUID;
BEGIN
    -- 1. Find an existing Auth User (to satisfy FK)
    SELECT id INTO v_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        -- 2a. Ensure [Legacy] user_profiles Exists (for children FK)
        IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = v_user_id) THEN
            INSERT INTO public.user_profiles (id, email, name, role, status)
            VALUES (v_user_id, 'test_user@example.com', '테스트유저', 'parent', 'active')
            ON CONFLICT (id) DO NOTHING;
        END IF;

        -- 2b. Ensure [New] profiles Exists (for Report View with Phone)
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
            INSERT INTO public.profiles (id, email, name, phone, role, created_at, updated_at)
            VALUES (v_user_id, 'test_user@example.com', '테스트유저', '010-0000-0000', 'parent', NOW(), NOW())
            ON CONFLICT (id) DO NOTHING;
        END IF;

        -- 3. Create Dummy Child Linked to this User
        IF NOT EXISTS (SELECT 1 FROM public.children WHERE name = '테스트아동') THEN
            INSERT INTO public.children (id, name, gender, birth_date, is_active, parent_id, created_at)
            VALUES (gen_random_uuid(), '테스트아동', 'male', '2020-01-01', true, v_user_id, NOW())
            RETURNING id INTO v_child_id;
        ELSE
            SELECT id INTO v_child_id FROM public.children WHERE name = '테스트아동';
        END IF;

        -- 4. Create Dummy Assessment
        IF NOT EXISTS (SELECT 1 FROM public.development_assessments WHERE child_id = v_child_id) THEN
            INSERT INTO public.development_assessments (
                child_id, therapist_id, evaluation_date, 
                score_communication, score_social, score_cognitive, score_motor, score_adaptive,
                summary, assessment_details
            )
            VALUES (
                v_child_id, v_user_id, NOW(), 
                4, 3, 5, 2, 4,
                '언어 발달이 우수하나 대근육 발달이 조금 늦습니다. (자동생성 데이터)',
                '{"communication": ["c1", "c2", "c3"], "social": ["s1", "s2"], "cognitive": ["g1", "g2", "g3", "g4"], "motor": ["m1"], "adaptive": ["a1", "a2", "a3"]}'::jsonb
            );
        END IF;
        
        RAISE NOTICE '✅ Dummy data inserted successfully for verification.';
    ELSE
        RAISE NOTICE '⚠️ No Auth User found. Skipping dummy data insertion. Please sign up a user first.';
    END IF;
END $$;


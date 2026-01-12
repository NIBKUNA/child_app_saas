-- ============================================================
-- 🚨 [EMERGENCY_RLS_REPAIR] RLS 무한 루프 긴급 복구
-- 1. children, user_profiles 등 핵심 테이블의 '모든' 정책을 강제 삭제
-- 2. 안전한 정책(MASTER_PERMISSION_FIX) 재적용
-- ============================================================

DO $$ 
DECLARE 
    r RECORD;
    tables TEXT[] := ARRAY['children', 'user_profiles', 'schedules', 'counseling_logs'];
    t TEXT;
BEGIN
    -- 1. 대상 테이블들의 모든 기존 정책 루프 삭제
    FOREACH t IN ARRAY tables
    LOOP
        FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public') 
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, t);
            RAISE NOTICE 'Dropped policy % on table %', r.policyname, t;
        END LOOP;
    END LOOP;
END $$;

-- 2. [함수 재정의] SECURITY DEFINER 및 search_path 명시로 안전성 강화
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM public.user_profiles
    WHERE id = auth.uid();
    RETURN v_role IN ('super_admin', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_therapist()
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM public.user_profiles
    WHERE id = auth.uid();
    RETURN v_role = 'therapist';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_parent_of(child_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    val INTEGER;
BEGIN
    -- children 테이블을 조회하므로, children 테이블 정책에서 이 함수를 부르면 무한 루프됨
    -- 하지만 우리는 children 정책에서 이 함수를 안 쓰므로 안전
    SELECT 1 INTO val FROM public.children
    WHERE id = child_uuid AND parent_id = auth.uid();
    RETURN val IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 3. [정책 재적용] 단순화되고 검증된 정책들

-- [children]
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_children_admin_all" ON public.children FOR ALL USING (public.is_admin());
CREATE POLICY "p_children_therapist_read" ON public.children FOR SELECT USING (public.is_therapist());
CREATE POLICY "p_children_parent_read" ON public.children FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "p_children_parent_update" ON public.children FOR UPDATE USING (parent_id = auth.uid());

-- [user_profiles]
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_profiles_read_all" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "p_profiles_update_admin_self" ON public.user_profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "p_profiles_insert_admin_self" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

-- [counseling_logs]
ALTER TABLE public.counseling_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_logs_admin_all" ON public.counseling_logs FOR ALL USING (public.is_admin());
CREATE POLICY "p_logs_therapist_access" ON public.counseling_logs FOR ALL USING (auth.uid() = therapist_id);
-- 부모는 읽기만 가능 (본인 자녀의 log)
CREATE POLICY "p_logs_parent_read" ON public.counseling_logs FOR SELECT USING (public.is_parent_of(child_id));

-- [schedules]
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_schedules_admin_all" ON public.schedules FOR ALL USING (public.is_admin());
CREATE POLICY "p_schedules_therapist_access" ON public.schedules FOR ALL USING (therapist_id = auth.uid());
CREATE POLICY "p_schedules_parent_read" ON public.schedules FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.children c WHERE c.id = schedules.child_id AND c.parent_id = auth.uid())
);

SELECT '✅ [EMERGENCY_RLS_REPAIR] 모든 정책 초기화 후 재설정 완료' AS result;

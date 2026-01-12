-- ==============================================================================
-- 🛡️ [MASTER_PERMISSION_FIX] 권한 시스템 및 데이터 무결성 통합 복구 키트
-- 작성자: 안욱빈 (Antigravity Agent)
-- 설명: 역할 오인식, 대리 작성 실패, 권한 변경 불가, 부모 연결 문제를 일괄 해결
-- ==============================================================================

-- 1. [Function] 무한 재귀 없는 안전한 Admin 체크 (Single Source of Truth)
-- user_profiles의 role 필드가 'super_admin' 또는 'admin'이면 true
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- 재귀 방지를 위해 직접 쿼리하지 않고 Auth Context는 무시 (DB 데이터 우선)
    SELECT role INTO v_role
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    RETURN v_role IN ('super_admin', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- ⚡ SECURITY DEFINER: RLS 우회하여 실행

-- 2. [Function] 치료사 여부 체크
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. [Function] 부모 여부 체크 (연결된 아동 확인용)
CREATE OR REPLACE FUNCTION public.is_parent_of(child_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.children
        WHERE id = child_uuid AND parent_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==============================================================================
-- 🚨 [RLS RESET] 기존 정책 충돌 방지를 위해 관련 테이블 정책 초기화
-- ==============================================================================

-- User Profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow individual update" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin Select" ON public.user_profiles;
DROP POLICY IF EXISTS "Everyone Select" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin Update" ON public.user_profiles;
DROP POLICY IF EXISTS "Self Update" ON public.user_profiles;

-- Counseling Logs
ALTER TABLE public.counseling_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Therapists can insert their own logs" ON public.counseling_logs;
DROP POLICY IF EXISTS "Therapists can update their own logs" ON public.counseling_logs;
DROP POLICY IF EXISTS "Therapists can select their own logs" ON public.counseling_logs;
DROP POLICY IF EXISTS "Admins can view all logs" ON public.counseling_logs;
DROP POLICY IF EXISTS "Admin All" ON public.counseling_logs;

-- Children (부모 연결 문제 해결)
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin All" ON public.children;
DROP POLICY IF EXISTS "Therapist Read" ON public.children;
DROP POLICY IF EXISTS "Parent Read Linked" ON public.children;


-- ==============================================================================
-- 🛡️ [NEW POLICIES] 강력하고 유연한 새 정책 적용
-- ==============================================================================

-- [A] user_profiles: 누구나 읽기 가능(직원 목록 등), 수정은 본인 또는 Admin만
CREATE POLICY "profiles_read_all" ON public.user_profiles
    FOR SELECT USING (true); -- 프로필 공개 (이름/직책 등 표시 위해)

CREATE POLICY "profiles_update_admin_or_self" ON public.user_profiles
    FOR UPDATE USING (
        auth.uid() = id  -- 본인
        OR
        public.is_admin() -- 관리자 (모든 프로필 수정 가능)
    );

CREATE POLICY "profiles_insert_admin_or_self" ON public.user_profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id  -- 회원가입 시 본인
        OR
        public.is_admin() -- 관리자가 수동 생성 시
    );

-- [B] counseling_logs: 대리 작성(Proxy Write) 지원
CREATE POLICY "logs_select_policy" ON public.counseling_logs
    FOR SELECT USING (
        public.is_admin() -- 관리자는 모두 봄
        OR
        auth.uid() = therapist_id -- 담당 치료사
        OR
        public.is_parent_of(child_id) -- 해당 아동의 부모
    );

CREATE POLICY "logs_insert_policy" ON public.counseling_logs
    FOR INSERT WITH CHECK (
        public.is_admin() -- ✨ [Key Fix] 관리자는 therapis_id가 본인이 아니어도 작성 가능
        OR
        auth.uid() = therapist_id -- 치료사는 본인 기록만
    );

CREATE POLICY "logs_update_policy" ON public.counseling_logs
    FOR UPDATE USING (
        public.is_admin() -- ✨ [Key Fix] 관리자는 수정 가능
        OR
        auth.uid() = therapist_id -- 치료사는 본인 기록만
    );
    
CREATE POLICY "logs_delete_policy" ON public.counseling_logs
    FOR DELETE USING ( public.is_admin() ); -- 기록 삭제는 관리자만

-- [C] children: 아동 정보 접근 (부모 연결 핵심)
CREATE POLICY "children_admin_all" ON public.children
    FOR ALL USING ( public.is_admin() );

CREATE POLICY "children_therapist_readonly" ON public.children
    FOR SELECT USING ( public.is_therapist() ); -- 치료사는 모든 아동 정보 열람 가능 (수업 위해)

CREATE POLICY "children_parent_access" ON public.children
    FOR SELECT USING ( parent_id = auth.uid() ); -- 부모는 자기 자녀만

-- 부모가 자녀 정보를 수정할 수 있게 하려면:
CREATE POLICY "children_parent_update" ON public.children
    FOR UPDATE USING ( parent_id = auth.uid() );


-- ==============================================================================
-- ✨ [Data Repair] 기존 데이터 연결 및 정합성 보정
-- ==============================================================================

-- 1. schedules 테이블 RLS도 Admin Proxy 가능하게 수정
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin All" ON public.schedules;
DROP POLICY IF EXISTS "Therapist Own" ON public.schedules;

CREATE POLICY "schedules_admin_all" ON public.schedules
    FOR ALL USING ( public.is_admin() );

CREATE POLICY "schedules_therapist_access" ON public.schedules
    FOR ALL USING ( therapist_id = auth.uid() );

CREATE POLICY "schedules_parent_read" ON public.schedules
    FOR SELECT USING ( 
        EXISTS (SELECT 1 FROM public.children c WHERE c.id = schedules.child_id AND c.parent_id = auth.uid())
    );

-- 2. Grant Permissions (안전장치)
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_therapist TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_parent_of TO authenticated;

SELECT '✅ [MASTER_PERMISSION_FIX] 권한 시스템 재구축 및 데이터 연결 정책 적용 완료' as result;

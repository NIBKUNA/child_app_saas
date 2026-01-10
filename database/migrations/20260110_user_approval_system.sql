-- ============================================================
-- Zarada ERP: 승인/거절 시스템 DB 스키마 업데이트
-- 생성일: 2026-01-10
-- ============================================================

-- ============================================================
-- PART 1: user_profiles 테이블에 status 컬럼 추가
-- ============================================================

-- 1.1 status 컬럼 추가 (pending, active, rejected)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- 1.2 기존 데이터 업데이트: 이미 role이 있는 사용자는 active로 설정
UPDATE public.user_profiles 
SET status = 'active' 
WHERE role IS NOT NULL AND role != 'parent' AND status IS NULL;

-- 1.3 신규 가입자(parent)는 pending으로 설정
UPDATE public.user_profiles 
SET status = 'pending' 
WHERE (role = 'parent' OR role IS NULL) AND status IS NULL;

-- ============================================================
-- PART 2: 인덱스 생성 (성능 최적화)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_center_id ON public.user_profiles(center_id);

-- ============================================================
-- PART 3: RLS 정책 업데이트 (승인/거절 권한)
-- ============================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "admin_manage_user_profiles" ON public.user_profiles;

-- Admin: 본인 센터의 user_profiles만 관리 가능
CREATE POLICY "admin_manage_user_profiles" ON public.user_profiles
FOR ALL USING (
    -- Super Admin: 모든 접근
    auth.email() = 'anukbin@gmail.com'
    OR
    -- Admin: 본인 센터 사용자만
    EXISTS (
        SELECT 1 FROM user_profiles admin_profile
        WHERE admin_profile.id = auth.uid()
        AND admin_profile.role = 'admin'
        AND admin_profile.center_id = user_profiles.center_id
    )
    OR
    -- 본인 프로필은 항상 조회 가능
    id = auth.uid()
);

-- ============================================================
-- PART 4: 신규 가입자 자동 생성 함수 (소셜 로그인 대비)
-- ============================================================

-- 신규 사용자가 로그인 시 user_profiles에 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, role, status, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        'parent',  -- 기본 역할: 학부모
        'pending', -- 기본 상태: 승인 대기
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거가 없으면 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 완료 메시지
-- ============================================================
SELECT '✅ 승인/거절 시스템 DB 스키마 업데이트 완료' AS status;

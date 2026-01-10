-- ============================================================
-- Zarada ERP: Super Admin 자동 권한 부여 트리거
-- 생성일: 2026-01-10
-- ============================================================

-- 설명: anukbin@gmail.com으로 가입되는 모든 레코드는
-- 즉시 role='admin', status='active'로 강제 설정됩니다.

-- ============================================================
-- PART 1: Super Admin 자동 승격 함수
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_super_admin()
RETURNS TRIGGER AS $$
DECLARE
    super_admin_email TEXT := 'anukbin@gmail.com';
BEGIN
    -- Super Admin 이메일인 경우 자동 승격
    IF LOWER(NEW.email) = LOWER(super_admin_email) THEN
        NEW.role := 'admin';
        NEW.status := 'active';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PART 2: 트리거 생성 (INSERT/UPDATE 시 적용)
-- ============================================================

-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS enforce_super_admin_trigger ON public.user_profiles;

-- 새 트리거 생성
CREATE TRIGGER enforce_super_admin_trigger
    BEFORE INSERT OR UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_super_admin();

-- ============================================================
-- PART 3: Super Admin 권한 수정 방지 함수
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_super_admin()
RETURNS TRIGGER AS $$
DECLARE
    super_admin_email TEXT := 'anukbin@gmail.com';
BEGIN
    -- Super Admin 계정의 role 또는 status 변경 시도 차단
    IF LOWER(OLD.email) = LOWER(super_admin_email) THEN
        -- role 또는 status가 변경되려고 하면 원래 값 유지
        IF NEW.role != 'admin' OR NEW.status != 'active' THEN
            NEW.role := 'admin';
            NEW.status := 'active';
            RAISE NOTICE 'Super Admin 계정은 권한을 변경할 수 없습니다.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS protect_super_admin_trigger ON public.user_profiles;

-- 보호 트리거 생성
CREATE TRIGGER protect_super_admin_trigger
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_super_admin();

-- ============================================================
-- 완료 메시지
-- ============================================================
SELECT '✅ Super Admin 트리거 생성 완료' AS status;

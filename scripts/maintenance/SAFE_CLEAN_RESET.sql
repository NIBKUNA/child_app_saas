-- ============================================================
-- 🛡️ [ZARADA PRODUCTION] SAFE CLEAN RESET (수정된 안전 버전)
-- 수정 사항: Center ID 고정 (프론트엔드 연결 유실 방지), 중복 에러 처리
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

BEGIN;

-- 1. [치명적/경고] 기존 데이터 완전 초기화
-- 원장님 요청대로 '에러 종합 파티'를 끝내기 위해 데이터를 밉니다.
TRUNCATE public.user_profiles, public.children CASCADE;
-- therapists 테이블도 있다면 밀어야 꼬이지 않습니다.
TRUNCATE public.therapists CASCADE; 

-- 2. [스키마 보정] 테이블/컬럼 없으면 생성
CREATE TABLE IF NOT EXISTS public.centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    subscription_tier TEXT DEFAULT 'standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    role TEXT DEFAULT 'parent',
    center_id UUID REFERENCES public.centers(id),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID REFERENCES public.centers(id),
    name TEXT NOT NULL,
    invitation_code TEXT UNIQUE,
    parent_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. [데이터 재건] 프론트엔드와 연결된 '그 센터' 강제 복구
DO $$
DECLARE
    v_user_id UUID;
    v_center_id UUID := '59d09adf-4c98-4013-a198-d7b26018fd29'; -- ⚠️ .env에 설정된 고정 ID
BEGIN
    -- [A] 원장님 ID 찾기
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'anukbin@gmail.com' LIMIT 1;
    
    -- [B] 센터 복구 (없으면 생성, 있으면 유지)
    INSERT INTO public.centers (id, name, slug) 
    VALUES (v_center_id, '자라다 아동심리발달센터', 'zarada-main')
    ON CONFLICT (id) DO UPDATE 
    SET name = '자라다 아동심리발달센터'; -- 이름만 동기화

    IF v_user_id IS NOT NULL THEN
        -- [C] 원장님 프로필 (Super Admin) 복구
        INSERT INTO public.user_profiles (id, email, name, role, center_id, status)
        VALUES (v_user_id, 'anukbin@gmail.com', '원장님', 'super_admin', v_center_id, 'active')
        ON CONFLICT (id) DO UPDATE
        SET role = 'super_admin', status = 'active', center_id = v_center_id;

        -- [D] 유저 메타데이터 수리
        UPDATE auth.users
        SET raw_app_meta_data = 
            jsonb_build_object('role', 'super_admin', 'center_id', v_center_id)
        WHERE id = v_user_id;
    END IF;
END $$;

-- 4. [RLS 정책] 관리자 프리패스
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins see all" ON public.user_profiles;
CREATE POLICY "Admins see all" ON public.user_profiles
FOR ALL USING (
    (SELECT (raw_app_meta_data->>'role') FROM auth.users WHERE id = auth.uid()) IN ('super_admin', 'admin')
    OR
    auth.jwt() ->> 'email' = 'anukbin@gmail.com' -- 이메일 하드코딩 추가 (안전장치)
);

COMMIT;

DO $$ BEGIN RAISE NOTICE '✅ 시스템이 초기화되고 원장님 계정이 복구되었습니다.'; END $$;

-- ============================================================
-- 🚀 FIX ADMIN SETTINGS TABLE FOR SaaS (MULTI-TENANT)
-- 해결: 지점별로 설정이 따로 저장되지 않거나 충돌하는 문제 해결
-- ============================================================

-- 1. 기존 테이블이 있다면 center_id 컬럼 추가 (SaaS 구조로 변경)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_settings' AND column_name = 'center_id') THEN
        -- center_id 컬럼 추가
        ALTER TABLE public.admin_settings ADD COLUMN center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE;
        
        -- 기존 데이터에 임의의 center_id가 할당되어 있다면 (혹은 null이라면) 
        -- PK 제약조건 변경을 위해 먼저 조치
        ALTER TABLE public.admin_settings DROP CONSTRAINT IF EXISTS admin_settings_pkey;
        
        -- center_id와 key를 묶어서 새로운 Primary Key 설정
        -- (기존에 데이터가 중복되어 있다면 삭제 후 진행해야 할 수 있음)
        ALTER TABLE public.admin_settings ADD PRIMARY KEY (center_id, key);
    END IF;
END $$;

-- 2. RLS(보안) 정책 재설계 (자신의 센터 설정만 수정 가능하도록)
DROP POLICY IF EXISTS "Public read access" ON public.admin_settings;
DROP POLICY IF EXISTS "Admin write access" ON public.admin_settings;

-- 누구나 읽을 수는 있지만 (홈페이지 표시용)
CREATE POLICY "Allow public read access" ON public.admin_settings
    FOR SELECT USING (true);

-- 수정은 해당 센터의 관리자/매니저만 가능
CREATE POLICY "Allow center admins to manage settings" ON public.admin_settings
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND (
                user_profiles.center_id = admin_settings.center_id 
                OR user_profiles.role = 'admin' -- 슈퍼어드민 등 예외 케이스
            )
        )
    );

-- 3. 스키마 캐시 갱신
NOTIFY pgrst, 'reload schema';

DO $$ BEGIN RAISE NOTICE '✅ admin_settings table has been evolved for Multi-center Support.'; END $$;

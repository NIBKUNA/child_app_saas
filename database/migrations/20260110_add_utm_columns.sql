-- 🎨 Zarada ERP UTM Tracking Support
-- -----------------------------------------------------------
-- 🛠️ Created by: 안욱빈 (An Uk-bin)
-- 📅 Date: 2026-01-10
-- 🖋️ Description: "마케팅 성과 추적을 위한 UTM 파라미터 컬럼 추가"

-- user_profiles 테이블에 UTM 컬럼 추가 (존재하지 않을 경우에만)
DO $$ 
BEGIN
    -- 1. utm_source
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='utm_source') THEN
        ALTER TABLE public.user_profiles ADD COLUMN utm_source VARCHAR(100);
    END IF;

    -- 2. utm_medium
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='utm_medium') THEN
        ALTER TABLE public.user_profiles ADD COLUMN utm_medium VARCHAR(100);
    END IF;

    -- 3. utm_campaign
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='utm_campaign') THEN
        ALTER TABLE public.user_profiles ADD COLUMN utm_campaign VARCHAR(100);
    END IF;

    -- 4. utm_term
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='utm_term') THEN
        ALTER TABLE public.user_profiles ADD COLUMN utm_term VARCHAR(255);
    END IF;

    -- 5. utm_content
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='utm_content') THEN
        ALTER TABLE public.user_profiles ADD COLUMN utm_content VARCHAR(255);
    END IF;
END $$;

SELECT '✅ 마케팅 트래킹 컬럼(UTM) 추가 완료' AS status;

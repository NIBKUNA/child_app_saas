-- 🧪 [Hybrid Injection] Test Data for BOTH Architectures
-- 코드(user_profiles)와 RLS(user_claims)의 괴리를 해결하기 위해 양쪽 다 주입합니다.

BEGIN;

-- 0. [Schema Restoration] 테이블이 없으면 생성 (Reset으로 날아갔을 경우 대비)
CREATE TABLE IF NOT EXISTS public.centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    email TEXT,
    claim_type TEXT NOT NULL,
    claim_value TEXT NOT NULL,
    center_id UUID REFERENCES public.centers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, claim_type, claim_value)
);

-- 1. [Center]
INSERT INTO public.centers (id, name, slug, created_at)
VALUES (
  '59d09adf-4c98-4013-a198-d7b26018fd29', 
  '자라다 아동심리발달센터 (Staging)', 
  'staging-center',
  NOW()
) ON CONFLICT (id) DO UPDATE 
SET slug = 'staging-center'; -- 혹시 이미 있는데 slug가 null이면 업데이트

-- 2. [Claims] New Architecture (RLS용)
INSERT INTO public.user_claims (user_id, email, claim_type, claim_value, center_id)
SELECT 
  id, 
  email, 
  'role', 
  'super_admin', 
  '59d09adf-4c98-4013-a198-d7b26018fd29'
FROM auth.users
WHERE email LIKE '%@gmail.com' -- 모든 지메일 계정 (혹은 특정 이메일)
ON CONFLICT (user_id, claim_type, claim_value) DO NOTHING;

-- 3. [User Profiles] Legacy Code Support
-- (TherapistList.tsx가 이걸 참조함)
INSERT INTO public.user_profiles (id, email, role, status, name, center_id)
SELECT 
  id, 
  email, 
  'super_admin', 
  'active', 
  '관리자(Test)', 
  '59d09adf-4c98-4013-a198-d7b26018fd29'
FROM auth.users
WHERE email LIKE '%@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'super_admin', status = 'active';

-- 4. [Therapists]
INSERT INTO public.therapists (id, center_id, name, email, bio, is_active)
VALUES (
  uuid_generate_v4(),
  '59d09adf-4c98-4013-a198-d7b26018fd29',
  '테스트 치료사',
  'test_therapist@files.com',
  '시스템 테스트용',
  TRUE
);

-- 5. [Children]
INSERT INTO public.children (id, center_id, name, birth_date, gender, notes)
VALUES (
  uuid_generate_v4(),
  '59d09adf-4c98-4013-a198-d7b26018fd29',
  '테스트 아동',
  '2020-01-01',
  'male',
  '데이터 공백 방지용'
);

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '✅ Hybrid Test Data Injected Successfully.';
END $$;

-- 🔓 [DEV MODE] Disable RLS for Unhindered Development
-- 요청사항: "앱 만드는 동안 방해하는 RLS 배제"
-- 모든 주요 테이블의 RLS를 비활성화(Disable)하여 권한 검사를 건너뜁니다.

BEGIN;

-- 1. User & Profiles
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapists DISABLE ROW LEVEL SECURITY;

-- 2. Core Data
ALTER TABLE public.centers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.children DISABLE ROW LEVEL SECURITY;

-- 3. Operations
ALTER TABLE public.schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_observations DISABLE ROW LEVEL SECURITY;

-- 4. Traffic & Logs
CREATE TABLE IF NOT EXISTS public.traffic_sources (
    id uuid default gen_random_uuid() primary key, 
    source text, medium text, campaign text, created_at timestamptz default now()
);
ALTER TABLE public.traffic_sources DISABLE ROW LEVEL SECURITY;

COMMIT;

DO $$ BEGIN RAISE NOTICE '✅ All RLS Disabled. Development Mode Active.'; END $$;

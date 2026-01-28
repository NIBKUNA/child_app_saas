
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
BEGIN;

-- 1. development_assessments 보정
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='development_assessments' AND column_name='therapist_id') THEN
        ALTER TABLE public.development_assessments ADD COLUMN therapist_id UUID;
    END IF;
END $$;

ALTER TABLE public.development_assessments DROP CONSTRAINT IF EXISTS da_children_fkey;
ALTER TABLE public.development_assessments ADD CONSTRAINT da_children_fkey FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;

ALTER TABLE public.development_assessments DROP CONSTRAINT IF EXISTS da_therapists_fkey;
ALTER TABLE public.development_assessments ADD CONSTRAINT da_therapists_fkey FOREIGN KEY (therapist_id) REFERENCES public.therapists(id) ON DELETE SET NULL;

-- 2. site_visits 테이블 생성
CREATE TABLE IF NOT EXISTS public.site_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
    source_category VARCHAR(50),
    referrer_url TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    page_url TEXT,
    user_agent TEXT,
    visited_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "site_visits_admin_all" ON public.site_visits;
CREATE POLICY "site_visits_admin_all" ON public.site_visits FOR ALL TO authenticated USING (true);

-- 3. daily_logs -> counseling_logs 보정 (alias/migration)
CREATE TABLE IF NOT EXISTS public.counseling_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES public.schedules(id) ON DELETE CASCADE,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 만약 daily_logs를 찾는 클라이언트를 위해 가짜 테이블 생성 (호환성용)
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES public.schedules(id) ON DELETE CASCADE
);

-- 4. RLS 권한 부여
GRANT ALL ON public.site_visits TO authenticated, service_role;
GRANT ALL ON public.counseling_logs TO authenticated, service_role;
GRANT ALL ON public.daily_logs TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
`;

async function run() {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
        console.error('SQL Error:', error);
        process.exit(1);
    }
    console.log('✅ Final System Alignment Success');
}

run();

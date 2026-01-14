-- 1. CENTERS Table Public Read
-- Allow anonymous users to read center information (needed for Footer, Header branding)
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on centers" ON public.centers;

CREATE POLICY "Allow public read access on centers"
ON public.centers
FOR SELECT
TO anon, authenticated
USING (true);

-- 2. ADMIN_SETTINGS Table Public Read
-- Ensure settings like Logo, Center Name, etc. are readable by everyone
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on admin_settings" ON public.admin_settings;

CREATE POLICY "Allow public read access on admin_settings"
ON public.admin_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- 3. Verify public.profiles / user_profiles (optional, but good for safety)
-- Usually profiles are private, but sometimes basic info might be needed. 
-- For now, focused on branding (centers/admin_settings).

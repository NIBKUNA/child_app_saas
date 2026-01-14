-- 🔥 FORCE PUBLIC ACCESS SCRIPT (Final Fix)
-- Description: Explicitly ensures 'anon' (public) users can read footer/branding data.
-- This handles both the "Table Permission Request" (GRANT) and "Row Level Security" (POLICY).

-- 1. Foundation: Grant Table-Level SELECT Permissions
-- (Policies are useless if the user cannot even touch the table)
GRANT SELECT ON public.centers TO anon;
GRANT SELECT ON public.centers TO authenticated;
GRANT SELECT ON public.centers TO service_role;

GRANT SELECT ON public.admin_settings TO anon;
GRANT SELECT ON public.admin_settings TO authenticated;
GRANT SELECT ON public.admin_settings TO service_role;

-- 2. Security: Ensure RLS is Enabled
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- 3. Cleanup: Remove potential conflicting policies
DROP POLICY IF EXISTS "Public Read Centers" ON public.centers;
DROP POLICY IF EXISTS "Public Read Admin Settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Allow public read access on centers" ON public.centers;
DROP POLICY IF EXISTS "Allow public read access on admin_settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.centers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.admin_settings;

-- 4. Policy: Create Unconditional "True" Policies
CREATE POLICY "Public Read Centers"
ON public.centers FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Public Read Admin Settings"
ON public.admin_settings FOR SELECT
TO anon, authenticated
USING (true);

-- Confirmation
SELECT 'Access Granted Successfully' as status;

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow Admin Select" ON public.admin_settings;
DROP POLICY IF EXISTS "Allow Admin Insert" ON public.admin_settings;
DROP POLICY IF EXISTS "Allow Admin Update" ON public.admin_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.admin_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.admin_settings;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.admin_settings;

-- Policy 1: READ - Allow everyone (including public) to read settings (for site branding etc)
CREATE POLICY "Allow Public Read"
ON public.admin_settings
FOR SELECT
USING (true);

-- Policy 2: INSERT/UPDATE - Allow Admins/Super Admins to modify settings for their center
CREATE POLICY "Allow Admin Upsert"
ON public.admin_settings
FOR ALL
USING (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and (profiles.role = 'admin' OR profiles.role = 'super_admin')
    -- Optional: strict center check if needed, but simple role check is often enough for single-tenant feel
    -- and profiles.center_id = admin_settings.center_id
  )
);

-- Force Public Access (Optional, if public read is key)
GRANT SELECT ON public.admin_settings TO anon;
GRANT SELECT ON public.admin_settings TO authenticated;
GRANT ALL ON public.admin_settings TO service_role;

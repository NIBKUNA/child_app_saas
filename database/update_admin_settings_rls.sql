-- Enable RLS on admin_settings if not already enabled
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow "authenticated" users (parents, staff, etc.) to READ all settings
-- This allows them to fetch contact info, logo, center name, etc.
CREATE POLICY "Allow authenticated read access"
ON public.admin_settings
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow "anon" (public) read access if needed for login page branding
-- (Optional: adjust based on strictness, but usually branding is public)
CREATE POLICY "Allow public read access"
ON public.admin_settings
FOR SELECT
TO anon
USING (true);

-- Ensure Super Admin has full control
CREATE POLICY "Super Admin full control"
ON public.admin_settings
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'super_admin'
)
WITH CHECK (
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'super_admin'
);

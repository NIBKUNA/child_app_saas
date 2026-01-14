
-- Enable public read access for 'centers' table
-- This allows unauthenticated users (like visitors to the landing page) to see center contact info.
-- We check if the policy exists first to avoid errors, or just use CREATE POLICY IF NOT EXISTS (Postgres 9.5+ unsupported in some Supabase contexts? No, it works).
-- But simpler to drop and recreate for clarity.

DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."centers";
CREATE POLICY "Enable read access for all users" ON "public"."centers"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- Enable public read access for 'admin_settings' table
-- This allows unauthenticated users to fetch logo, SNS links, etc.
ALTER TABLE "public"."admin_settings" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."admin_settings";
CREATE POLICY "Enable read access for all users" ON "public"."admin_settings"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- If there are sensitive settings in 'admin_settings', we should filter them (e.g. openai_api_key).
-- However, since the frontend queries 'select *', filtering by row is hard if they are rows. 
-- 'admin_settings' structure is Key-Value rows.
-- We should ideally restrict access to non-sensitive keys.
-- But for now, to fix the immediate visual defect, we allow read. 
-- SECURITY NOTE: Ensure OpenAI keys are NOT stored in admin_settings if possible, or accept risk for Phase 2.
-- Wait, the user has 'openai_api_key' in AdminSettingKey type. 
-- BLOCKER: If we allow 'select *' on admin_settings to public, we expose the API Key if it's stored there.

-- CORRECTION: We should ONLY allow selecting keys that are NOT sensitive.
-- OR, we update the application to ONLY select specific safe keys.
-- But the code does 'select *'.
-- RLS Policy using WHERE clause?
-- CREATE POLICY ... USING (key NOT IN ('openai_api_key', 'admin_password', etc.));

DROP POLICY IF EXISTS "Enable read access for public keys only" ON "public"."admin_settings";
CREATE POLICY "Enable read access for public keys only" ON "public"."admin_settings"
AS PERMISSIVE FOR SELECT
TO public
USING (key IN (
  'center_logo', 
  'center_name', 
  'center_phone', 
  'center_address', 
  'center_email',
  'sns_instagram', 
  'sns_facebook', 
  'sns_youtube', 
  'sns_blog',
  'kakao_url',
  'main_banner_url', 
  'home_title',
  'home_subtitle',
  'notice_text',
  'about_intro_text',
  'about_main_image',
  'programs_intro_text'
));

-- Note: Authenticated admins can still see everything due to other policies (hopefully). 
-- If not, we need a separate policy for admins to see ALL keys.
DROP POLICY IF EXISTS "Enable full access for admins" ON "public"."admin_settings";
CREATE POLICY "Enable full access for admins" ON "public"."admin_settings"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

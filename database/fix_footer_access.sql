
-- Ensures public access to the specific keys used in the Footer
-- This is critical for the Footer to render when logged out.

-- 1. Enable RLS
ALTER TABLE "public"."admin_settings" ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policy if any (to be safe)
DROP POLICY IF EXISTS "Public Read Admin Settings" ON "public"."admin_settings";

-- 3. Create Policy
CREATE POLICY "Public Read Admin Settings" ON "public"."admin_settings"
FOR SELECT
TO public
USING (
    key IN (
        'center_name',
        'center_phone',
        'center_address',
        'center_email',
        'center_logo',
        'sns_instagram',
        'sns_facebook',
        'sns_youtube',
        'sns_blog',
        'kakao_url',
        'main_banner_url',
        'home_title'
    )
);

-- 4. Grant Select permission to anonymous and authenticated
GRANT SELECT ON "public"."admin_settings" TO anon;
GRANT SELECT ON "public"."admin_settings" TO authenticated;

-- 5. Force refresh for centers table as well just in case
DROP POLICY IF EXISTS "Public Read Centers" ON "public"."centers";
CREATE POLICY "Public Read Centers" ON "public"."centers"
FOR SELECT
TO public
USING (true);

GRANT SELECT ON "public"."centers" TO anon;

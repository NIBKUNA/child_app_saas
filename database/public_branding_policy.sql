-- Allow public (anon) read access to specific branding keys in admin_settings
-- This ensures API keys like 'openai_api_key' are NOT exposed.

create policy "Enable read access for all users for branding settings"
on "public"."admin_settings"
as permissive
for select
to public
using (
  key in (
    'center_name', 
    'center_address', 
    'center_phone', 
    'center_logo', 
    'sns_instagram', 
    'sns_facebook', 
    'sns_youtube', 
    'sns_blog',
    'weekday_hours',
    'saturday_hours',
    'holiday_text'
  )
);

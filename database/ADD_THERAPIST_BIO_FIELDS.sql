-- 🏥 Add Career Bio and Public Visibility fields to therapists table
BEGIN;

ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS career text;
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS specialties text;
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS profile_image text;
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS website_visible boolean DEFAULT false;

COMMIT;

SELECT '✅ Career fields added to therapists table.' as status;

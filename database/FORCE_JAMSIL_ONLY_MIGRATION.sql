
-- 🚨 CRITICAL MIGRATION: FORCE SINGLE CENTER (JAMSIL) 🚨
-- Taret Center ID: d327993a-e558-4442-bac5-1469306c35bb

BEGIN;

-- 1. Unify 'admin_settings'
UPDATE public.admin_settings
SET center_id = 'd327993a-e558-4442-bac5-1469306c35bb'
WHERE center_id != 'd327993a-e558-4442-bac5-1469306c35bb';

-- 2. Unify 'profiles' / 'user_profiles'
-- (Also sets all users to be members of Jamsil)
UPDATE public.profiles
SET center_id = 'd327993a-e558-4442-bac5-1469306c35bb';

UPDATE public.user_profiles
SET center_id = 'd327993a-e558-4442-bac5-1469306c35bb';

-- 3. Unify 'children'
UPDATE public.children
SET center_id = 'd327993a-e558-4442-bac5-1469306c35bb';

-- 4. Unify 'consultations' (Fixes missing inquiries)
UPDATE public.consultations
SET center_id = 'd327993a-e558-4442-bac5-1469306c35bb';

-- 5. Unify 'invitation_codes'
UPDATE public.invitation_codes
SET center_id = 'd327993a-e558-4442-bac5-1469306c35bb';

-- 6. Unify 'therapists'
UPDATE public.therapists
SET center_id = 'd327993a-e558-4442-bac5-1469306c35bb';

-- 7. Delete other centers (Cleanup)
DELETE FROM public.centers 
WHERE id != 'd327993a-e558-4442-bac5-1469306c35bb';

-- 8. Ensure Jamsil Center Exists (Upsert)
INSERT INTO public.centers (id, name, address, phone, slug)
VALUES (
    'd327993a-e558-4442-bac5-1469306c35bb',
    '자라다 아동심리발달센터 잠실점',
    '서울특별시 송파구 석촌호수로12길 51 201호',
    '02-416-2213',
    'jamsil'
)
ON CONFLICT (id) DO UPDATE
SET name = '자라다 아동심리발달센터 잠실점',
    address = '서울특별시 송파구 석촌호수로12길 51 201호',
    phone = '02-416-2213',
    slug = 'jamsil';

COMMIT;

SELECT 'MIGRATION COMPLETE: All data pointed to Jamsil.' as status;

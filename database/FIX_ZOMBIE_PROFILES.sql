
-- 🚨 CRITICAL FIX: SYNC PROFILES & DOWNGRADE ZOMBIE USER

-- 1. Fix the specific ghost user 'zaradajoo' in the 'profiles' table
-- (This is the table the app ACTUALLY reads, which explains why they still had access)
UPDATE public.profiles
SET role = 'parent', 
    status = 'active',
    updated_at = NOW()
WHERE email = 'zaradajoo@gmail.com';

-- 2. Sync Auth Metadata (For Google Login persistence)
UPDATE auth.users
SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', 'parent', 'status', 'active')
WHERE email = 'zaradajoo@gmail.com';

-- 3. [OPTIONAL BUT RECOMMENDED] Sync 'user_profiles' with 'profiles'
-- This prevents the "I see 1 row but app sees 5 rows" confusion in the future.
INSERT INTO public.user_profiles (id, email, role, status, name)
SELECT id, email, role, status, name
FROM public.profiles
ON CONFLICT (id) DO UPDATE
SET role = EXCLUDED.role,
    status = EXCLUDED.status,
    name = EXCLUDED.name;

SELECT 'Fixed zaradajoo and synced ' || count(*) || ' profiles.' as result FROM public.profiles;


-- Check if zaradajoo exists in the 'profiles' table (which AuthContext uses)
SELECT * FROM public.profiles WHERE email = 'zaradajoo@gmail.com';

-- Compare counts again to be sure
SELECT 'profiles' as table_name, count(*) FROM public.profiles
UNION ALL
SELECT 'user_profiles' as table_name, count(*) FROM public.user_profiles;

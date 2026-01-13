
-- 🚨 CRITICAL FIX: Repair Admin/Therapist Profile for Assessment Saving 🚨
-- Target: anukbin@gmail.com (From screenshot) and ensure Jamsil Center

BEGIN;

-- 1. Identify the User ID from auth.users (if possible) or just verify existence
DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'anukbin@gmail.com';
BEGIN
    -- Get ID from profiles or auth if possible. 
    -- Since we can't easily access auth.users in plain SQL block without proper permissions often, 
    -- we rely on profiles. If profiles is also missing, we might have a problem.
    -- However, anukbin@gmail.com usually exists.
    
    SELECT id INTO v_user_id FROM public.profiles WHERE email = v_email;
    
    IF v_user_id IS NULL THEN
        -- Fallback: Use a known ID if you re-seeded or try to find from user_profiles
        SELECT id INTO v_user_id FROM public.user_profiles WHERE email = v_email;
    END IF;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User % not found in profiles or user_profiles. Please verify the email.', v_email;
    END IF;

    -- 2. Upsert into user_profiles (The table referenced by development_assessments)
    INSERT INTO public.user_profiles (id, email, role, status, name, center_id)
    VALUES (
        v_user_id,
        v_email,
        'super_admin', -- or 'admin' / 'therapist'
        'active',
        '안욱빈 (Admin)',
        'd327993a-e558-4442-bac5-1469306c35bb' -- Jamsil Center
    )
    ON CONFLICT (id) DO UPDATE
    SET center_id = 'd327993a-e558-4442-bac5-1469306c35bb',
        role = 'super_admin',
        status = 'active',
        name = '안욱빈 (Admin)';

    -- 3. Also Sync public.profiles (just in case)
    UPDATE public.profiles
    SET center_id = 'd327993a-e558-4442-bac5-1469306c35bb',
        role = 'super_admin'
    WHERE id = v_user_id;

    RAISE NOTICE 'Fixed User Profile for % (ID: %)', v_email, v_user_id;

END $$;

COMMIT;


-- 🚨 FORCE SYNC SUPER ADMIN 🚨
-- Ensures 'anukbin@gmail.com' is in 'user_profiles' with correct Jamsil Center ID.

BEGIN;

DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'anukbin@gmail.com';
    v_jamsil_id UUID := 'd327993a-e558-4442-bac5-1469306c35bb';
BEGIN
    -- 1. Try to find ID from profiles or user_profiles
    SELECT id INTO v_user_id FROM public.profiles WHERE email = v_email;
    
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM public.user_profiles WHERE email = v_email;
    END IF;

    IF v_user_id IS NULL THEN
        -- If really not found in standard tables, try auth.users (requires specific permission/view, possibly not available in this block context easily without pg_security)
        -- Taking a safe guess or just raising notice if we can't find it to link.
        -- We will assume the user MUST exist in profiles for this script to work fully effectively as an UPSERT.
        -- But for now, let's verify if we can proceed.
        RAISE NOTICE 'User % not found in public tables. Please ensure you have signed up.', v_email;
    ELSE
        -- 2. Upsert into user_profiles
        INSERT INTO public.user_profiles (id, email, role, status, name, center_id)
        VALUES (
            v_user_id,
            v_email,
            'super_admin',
            'active',
            '안욱빈 (Admin)',
            v_jamsil_id
        )
        ON CONFLICT (id) DO UPDATE
        SET role = 'super_admin',
            status = 'active',
            center_id = v_jamsil_id, -- Force Jamsil
            name = '안욱빈 (Admin)';
            
        -- 3. Sync profiles table too
        UPDATE public.profiles
        SET role = 'super_admin',
            center_id = v_jamsil_id
        WHERE id = v_user_id;
        
        RAISE NOTICE '✅ Super Admin synced successfully: % (ID: %)', v_email, v_user_id;
    END IF;
END $$;

COMMIT;

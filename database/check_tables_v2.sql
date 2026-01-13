
DO $$
DECLARE
    v_profiles_count INT;
    v_user_profiles_count INT;
BEGIN
    SELECT COUNT(*) INTO v_profiles_count FROM public.profiles;
    SELECT COUNT(*) INTO v_user_profiles_count FROM public.user_profiles;
    
    RAISE NOTICE 'Profiles Count: %, User Profiles Count: %', v_profiles_count, v_user_profiles_count;
    
    IF v_profiles_count != v_user_profiles_count THEN
        RAISE NOTICE 'WARNING: Table counts mismatch! Data might be desynchronized.';
    ELSE
        RAISE NOTICE 'Counts match. Likely aliases or synced.';
    END IF;
END $$;

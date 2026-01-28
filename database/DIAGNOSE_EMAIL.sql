-- 📧 Email Diagnosis Script
-- Check if 'zombi00000@naver.com' exists in any table
-- Run this to see what's blocking the signup.

DO $$
DECLARE
  v_email TEXT := 'zombi00000@naver.com';
  v_profile RECORD;
  v_therapist RECORD;
  v_auth_uid UUID;
BEGIN
  -- 1. Check User Profiles
  SELECT * INTO v_profile FROM public.user_profiles WHERE email = v_email;
  
  -- 2. Check Therapists
  SELECT * INTO v_therapist FROM public.therapists WHERE email = v_email;

  -- 3. Check Auth (Internal Lookup via ID from profile if matches)
  -- Note: We can't query auth.users directly easily in DO block usually without permissions, 
  -- but we can infer existence if the signup failed.
  
  RAISE NOTICE '============================================';
  RAISE NOTICE '🔍 DIAGNOSIS FOR: %', v_email;
  RAISE NOTICE '============================================';
  
  IF v_profile IS NOT NULL THEN
    RAISE NOTICE '✅ Found in [user_profiles]';
    RAISE NOTICE '   - ID: %', v_profile.id;
    RAISE NOTICE '   - Role: %', v_profile.role;
    RAISE NOTICE '   - Name: %', v_profile.name;
    RAISE NOTICE '   - Created At: %', v_profile.created_at;
  ELSE
    RAISE NOTICE '❌ Not found in [user_profiles]';
  END IF;

  IF v_therapist IS NOT NULL THEN
    RAISE NOTICE '✅ Found in [therapists]';
    RAISE NOTICE '   - Name: %', v_therapist.name;
    RAISE NOTICE '   - Role: %', v_therapist.system_role;
    RAISE NOTICE '   - Status: %', v_therapist.system_status;
  ELSE
    RAISE NOTICE '❌ Not found in [therapists]';
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'If "Found in user_profiles" is YES, this email is already taken.';
  RAISE NOTICE 'If you want to reuse this email, you must DELETE this user first.';
  RAISE NOTICE '============================================';

END $$;

-- =======================================================
-- 🗑️ FORCE CLEANUP SCRIPT
-- Specific Cleanup for 'zombi00000@naver.com'
-- Use this if you want to allow this email to sign up again.
-- =======================================================

CREATE OR REPLACE FUNCTION public.force_cleanup_user_by_email(target_email TEXT)
RETURNS void AS $$
DECLARE
  target_id UUID;
BEGIN
  -- 1. Find User ID from auth.users (requires permission) or user_profiles
  -- We try to find it from user_profiles first.
  SELECT id INTO target_id FROM public.user_profiles WHERE email = target_email;

  -- 2. If not in profiles, try to find in therapists?
  IF target_id IS NULL THEN
     -- Try to find by email in auth.users indirectly if possible, but usually we can't from here.
     -- Let's assume passed ID if known. But here we only have email.
     -- We will print message if not found.
     RAISE NOTICE 'User profile not found for email: %. Attempting deeper cleanup...', target_email;
  ELSE
     RAISE NOTICE 'Found User ID: %, Cleaning up...', target_id;
     
     -- 3. Perform Deletion (Using our V6 logic manually)
     -- Unlink Children
     UPDATE public.children SET parent_id = NULL WHERE parent_id = target_id;
     
     -- Unlink Therapists (Don't delete record, just unlink auth)
     UPDATE public.therapists SET profile_id = NULL WHERE profile_id = target_id;
     UPDATE public.therapists SET profile_id = NULL WHERE email = target_email;
     
     -- Delete Profile
     DELETE FROM public.user_profiles WHERE id = target_id;
     
     -- Delete from Auth (Nuclear)
     DELETE FROM auth.users WHERE id = target_id;
     
     RAISE NOTICE 'Cleanup Complete.';
  END IF;
  
  -- Special Case: Check if it exists in auth.users BUT NOT in user_profiles (Ghost User)
  -- We can try to delete from auth.users directly by email if extensions allow
  -- DELETE FROM auth.users WHERE email = target_email; -- This might work if superuser runs it
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Excecute immediately for the requested email
SELECT public.force_cleanup_user_by_email('zombi00000@naver.com');

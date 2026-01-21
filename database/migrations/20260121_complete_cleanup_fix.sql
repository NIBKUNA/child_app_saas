-- ============================================================
-- 🛠️ DATABASE INTEGRITY & CASCADE DELETE FIX
-- 📅 Date: 2026-01-21
-- 🖋️ Description: "Ghost data elimination and complete cleanup"
-- ============================================================

-- [1] Update Foreign Keys to CASCADE
-- This ensures that deleting a Profile (via Auth) also deletes the Parent/Therapist record.

-- Parents Table
ALTER TABLE public.parents
DROP CONSTRAINT IF EXISTS parents_profile_id_fkey;

ALTER TABLE public.parents
ADD CONSTRAINT parents_profile_id_fkey 
FOREIGN KEY (profile_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Therapists Table
ALTER TABLE public.therapists
DROP CONSTRAINT IF EXISTS therapists_profile_id_fkey;

ALTER TABLE public.therapists
ADD CONSTRAINT therapists_profile_id_fkey 
FOREIGN KEY (profile_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Counseling Logs (Ensuring CASCADE)
ALTER TABLE public.counseling_logs
DROP CONSTRAINT IF EXISTS counseling_logs_child_id_fkey;

ALTER TABLE public.counseling_logs
ADD CONSTRAINT counseling_logs_child_id_fkey 
FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;

-- [2] Update admin_delete_user RPC to Version 6 (Lethal Mode)
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS void AS $$
DECLARE
  caller_email TEXT;
  target_email TEXT;
BEGIN
  -- 1. Security Check
  SELECT email INTO caller_email FROM auth.users WHERE id = auth.uid();
  
  IF caller_email IS NULL OR caller_email != 'anukbin@gmail.com' THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admin can perform this action.';
  END IF;

  -- 2. Get Target Email
  SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;

  -- 3. Pre-emptive Cleanup (for things that might block delete or need manual unlinking)
  -- Unlink from blog posts
  UPDATE public.blog_posts SET author_id = NULL WHERE author_id = target_user_id;
  
  -- Unlink from children (if parent is deleted but we want to KEEP children data? 
  -- Actually, the user asked for COMPLETE deletion of Info. 
  -- But usually, deleting a parent doesn't mean we delete the child record instantly unless we want to.
  -- In this ERP, children belong to the center. So we unlink parents.
  UPDATE public.children SET parent_id = NULL WHERE parent_id IN (SELECT id FROM public.parents WHERE profile_id = target_user_id);

  -- 4. Delete linked app records
  DELETE FROM public.family_relationships WHERE parent_id = target_user_id;
  DELETE FROM public.admin_notifications WHERE user_id = target_user_id;
  
  -- ✨ [NEW] Delete from parents/therapists specifically (redundant if CASCADE works, but safe)
  DELETE FROM public.parents WHERE profile_id = target_user_id;
  DELETE FROM public.therapists WHERE profile_id = target_user_id;
  
  -- 5. Delete User Profile (Cascades to other tables now)
  DELETE FROM public.user_profiles WHERE id = target_user_id;
  
  -- 6. Storage Cleanup
  DELETE FROM storage.objects WHERE owner = target_user_id;

  -- 7. Hard Auth Deletion
  DELETE FROM auth.sessions WHERE user_id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;

  RAISE NOTICE 'User % and all linked data completely purged.', target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_delete_user TO authenticated;

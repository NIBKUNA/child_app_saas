-- [COMPLETE AUTOMATION] User Deletion Function
-- This function allows Admins to delete users from the 'auth.users' table directly.
-- Because table constraints (ON DELETE CASCADE) are now set, this will auto-delete
-- all related data (profiles, therapists, parents) in a single blow.

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with Superuser privileges
SET search_path = public -- Security best practice
AS $$
DECLARE
  requesting_user_role text;
BEGIN
  -- 1. Identify the role of the user requesting the deletion
  SELECT role INTO requesting_user_role
  FROM public.user_profiles
  WHERE id = auth.uid();

  -- 2. Permission Check: Only 'super_admin' or 'admin' can delete users
  IF requesting_user_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only Admins can delete users.';
  END IF;

  -- 3. Prevent Suicide (Cannot delete yourself)
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Operation Failed: You cannot delete your own account.';
  END IF;

  -- 4. Execute Deletion (The Nuclear Option)
  -- Thanks to "ON DELETE CASCADE" in previous setup, this single line cleans everything.
  DELETE FROM auth.users WHERE id = target_user_id;

END;
$$;

-- Grant execution permission to authenticated users (The function itself checks roles)
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;

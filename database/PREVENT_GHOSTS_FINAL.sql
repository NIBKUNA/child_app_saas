-- =======================================================
-- 🛡️ GHOST ACCOUNT PREVENTION & SELF-HEALING SYSTEM
-- =======================================================

-- 1. [CRITICAL FIX] Update handle_new_user to FAIL the transaction on error.
--    Why? Previously, we caught exceptions (RAISE WARNING). This caused Auth to succeed but Profile to fail.
--    Result: Ghost Account.
--    New Logic: If Profile creation fails, we must RAISE EXCEPTION to rollback Auth creation.
--    This is the only way to ensure atomic Consistency.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_center_id UUID;
    v_role user_role; -- Strict Type
    v_name VARCHAR;
BEGIN
    -- 1. Parse Metadata
    BEGIN
        IF new.raw_user_meta_data->>'center_id' IS NULL THEN
             -- Allow NULL for Super Admin or System Users, but warn
             v_center_id := NULL;
        ELSE
             v_center_id := (new.raw_user_meta_data->>'center_id')::UUID;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- If center_id is garbage, we should arguably FAIL or set NULL.
        -- Let's set NULL to be safe, but checks later might fail if center is required.
        v_center_id := NULL;
    END;

    -- Cast Role Safely
    BEGIN
        v_role := (COALESCE(new.raw_user_meta_data->>'role', 'parent'))::user_role;
    EXCEPTION WHEN OTHERS THEN
        v_role := 'parent'::user_role; -- Default fallback
    END;

    v_name := COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'New User');

    -- 2. Insert Profile (Strict)
    -- If this fails, the whole transaction (including Auth) rolls back.
    INSERT INTO public.user_profiles (id, email, name, role, center_id, status)
    VALUES (
        new.id,
        new.email,
        v_name,
        v_role,
        v_center_id,
        'active'
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- Re-Apply Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. [SELF-HEALING] Cron-ready RPC to clean Ghosts automatically
--    Use this periodically or when Admin Dashboard loads
CREATE OR REPLACE FUNCTION public.cleanup_ghost_users()
RETURNS TABLE (deleted_email TEXT, deleted_id UUID) AS $$
DECLARE
  ghost_record RECORD;
BEGIN
  -- Validate Sender (Super Admin Only)
  IF (SELECT role FROM public.user_profiles WHERE id = auth.uid()) != 'super_admin' AND 
     (SELECT email FROM auth.users WHERE id = auth.uid()) != 'anukbin@gmail.com' THEN
      RAISE EXCEPTION 'Access Denied';
  END IF;

  FOR ghost_record IN 
      SELECT id, email FROM auth.users 
      WHERE id NOT IN (SELECT id FROM public.user_profiles)
  LOOP
      -- Delete the ghost from Auth
      DELETE FROM auth.users WHERE id = ghost_record.id;
      
      deleted_email := ghost_record.email;
      deleted_id := ghost_record.id;
      RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. [DIAGNOSTIC] View for Ghost Accounts
--    Easy checking query
CREATE OR REPLACE VIEW public.view_ghost_users AS
SELECT au.id, au.email, au.created_at, au.last_sign_in_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

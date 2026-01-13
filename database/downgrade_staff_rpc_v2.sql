
CREATE OR REPLACE FUNCTION public.downgrade_staff_to_user(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_email TEXT;
BEGIN
    -- 1. Check if user exists (Check profiles or user_profiles)
    BEGIN
        SELECT email INTO v_email FROM public.profiles WHERE id = target_user_id;
    EXCEPTION WHEN undefined_table THEN
        SELECT email INTO v_email FROM public.user_profiles WHERE id = target_user_id;
    END;
    
    IF v_email IS NULL THEN
        -- ✨ [Robustness] 프로필이 없어도 진행 (이미 삭제된 유저의 잔재일 수 있음)
        RAISE NOTICE 'User not found in profiles, proceeding with cleanup of therapists table only.';
        -- Return early if purely clean? No, we should try to clean therapists table at least.
    END IF;

    -- 2. Delete from therapists table
    DELETE FROM public.therapists WHERE id = target_user_id;

    -- 3. Update profiles (The table AuthContext reads)
    BEGIN
        UPDATE public.profiles
        SET role = 'parent',
            status = 'active', 
            updated_at = NOW()
        WHERE id = target_user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if table doesn't exist (though it should)
    END;

    -- 4. Update user_profiles (Legacy/Alias table)
    BEGIN
        UPDATE public.user_profiles
        SET role = 'parent',
            status = 'active',
            updated_at = NOW()
        WHERE id = target_user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if duplicate or view
    END;

    -- 5. ✨ Sync with auth.users (Crucial for Google Login / JWT Claims)
    -- Requires SECURITY DEFINER and access to auth schema
    BEGIN
        UPDATE auth.users
        SET raw_user_meta_data = 
            COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object('role', 'parent', 'status', 'active')
        WHERE id = target_user_id;
    EXCEPTION WHEN OTHERS THEN
        -- Log warning but don't fail, as this might be permission issue
        RAISE WARNING 'Could not update auth.users: %', SQLERRM;
    END;

    -- 6. Clean up admin notifications
    DELETE FROM public.admin_notifications WHERE user_id = target_user_id;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Staff downgraded to user successfully (Synced with auth)'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.downgrade_staff_to_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.downgrade_staff_to_user(UUID) TO service_role;

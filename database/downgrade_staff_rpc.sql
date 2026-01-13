
CREATE OR REPLACE FUNCTION public.downgrade_staff_to_user(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT;
BEGIN
    -- 1. Check if user exists
    SELECT email INTO v_email FROM public.user_profiles WHERE id = target_user_id;
    
    IF v_email IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'User not found');
    END IF;

    -- 2. Delete from therapists table (Staff list removal)
    DELETE FROM public.therapists WHERE id = target_user_id;

    -- 3. Update user_profiles (Downgrade to 'user')
    UPDATE public.user_profiles
    SET role = 'user',
        status = 'active', -- Ensure they can login as parent
        updated_at = NOW()
    WHERE id = target_user_id;

    -- 4. Clean up admin notifications if any
    DELETE FROM public.admin_notifications WHERE user_id = target_user_id;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Staff downgraded to user successfully'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.downgrade_staff_to_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.downgrade_staff_to_user(UUID) TO service_role;

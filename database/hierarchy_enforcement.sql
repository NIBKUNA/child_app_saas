-- 👑 Role Hierarchy Enforcement Logic
-- This function replaces direct updates to ensure strict hierarchy.

CREATE OR REPLACE FUNCTION public.approve_user_hierarchy(
    target_user_id uuid,
    new_role text
)
RETURNS void AS $$
DECLARE
    executor_role text;
    executor_email text;
BEGIN
    -- 1. Get Executor Context
    SELECT role INTO executor_role FROM public.user_profiles WHERE id = auth.uid();
    SELECT public.get_auth_email() INTO executor_email;

    -- Fortress Override
    IF executor_email = 'anukbin@gmail.com' THEN
        executor_role := 'super_admin';
    END IF;

    -- 2. Validate Target Role Hierarchy
    IF new_role = 'admin' THEN
        -- Only Super Admin can make other Admins
        IF executor_role != 'super_admin' THEN
            RAISE EXCEPTION 'Access Denied: Only Super Admin can promote users to Admin.';
        END IF;

    ELSIF new_role = 'therapist' THEN
        -- Admin or Super Admin can make Therapists
        IF executor_role NOT IN ('super_admin', 'admin') THEN
            RAISE EXCEPTION 'Access Denied: You do not have permission to approve Therapists.';
        END IF;
    
    ELSE
        -- Default (e.g. approving a generic staff or parent) requires at least Admin
        IF executor_role NOT IN ('super_admin', 'admin') THEN
             RAISE EXCEPTION 'Access Denied.';
        END IF;
    END IF;

    -- 3. Execute Update
    UPDATE public.user_profiles
    SET 
        role = new_role,
        status = 'active'
    WHERE id = target_user_id;

    -- 4. If creating a Therapist, ensure entry in therapists table
    IF new_role = 'therapist' THEN
        INSERT INTO public.therapists (id, user_id, name, email, center_id)
        SELECT 
            target_user_id, 
            target_user_id, 
            name, 
            email, 
            center_id 
        FROM public.user_profiles 
        WHERE id = target_user_id
        ON CONFLICT (id) DO NOTHING;
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

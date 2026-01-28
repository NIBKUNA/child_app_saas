-- =======================================================
-- 🛡️ FINAL TRIGGER STABILIZATION (V4)
-- =======================================================
-- Problem: 500 Error persists. Log is blocked by Rollback.
-- Solution:
-- 1. Use RAISE WARNING instead of RAISE EXCEPTION for debug.
-- 2. Handle 'role' logic extremely defensively.
-- 3. Ensure NO empty strings pass to uuid.
-- 4. Strip whitespace from inputs.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_center_id UUID;
    v_role user_role;
    v_name VARCHAR;
    v_center_input TEXT;
    v_role_input TEXT;
BEGIN
    -- 1. Parse Center ID
    BEGIN
        v_center_input := NULLIF(TRIM(new.raw_user_meta_data->>'center_id'), '');
        
        IF v_center_input IS NOT NULL THEN
             v_center_id := v_center_input::UUID;
        ELSE
             v_center_id := NULL;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_center_id := NULL;
        RAISE WARNING 'Invalid center_id in meta: %', new.raw_user_meta_data->>'center_id';
    END;

    -- 2. Parse Role
    BEGIN
        v_role_input := NULLIF(TRIM(new.raw_user_meta_data->>'role'), '');
        
        -- Default to parent if null/empty
        IF v_role_input IS NULL THEN
            v_role := 'parent'::user_role;
        ELSE
            -- Cast to strict enum. If fails, it jumps to exception.
            v_role := v_role_input::user_role;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_role := 'parent'::user_role;
        RAISE WARNING 'Invalid role cast: % -> defaulting to parent', v_role_input;
    END;

    v_name := COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'New User');

    -- 3. Insert Profile
    BEGIN
        INSERT INTO public.user_profiles (id, email, name, role, center_id, status)
        VALUES (
            new.id,
            new.email,
            v_name,
            v_role,
            v_center_id,
            'active'
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            center_id = EXCLUDED.center_id,
            updated_at = NOW();
            
    EXCEPTION WHEN OTHERS THEN
        -- 🔥 CRITICAL: DO NOT FAIL THE AUTH. JUST LOG WARNING.
        -- Ghost accounts are better than 500 errors for now (we can fix ghosts later).
        -- Priority is to let the user IN.
        RAISE WARNING 'Profile creation failed: % %', SQLERRM, SQLSTATE;
        
        -- Insert into debug logs IF possible (might fail if transaction aborts, but warning persists in Postgres logs)
        -- We try one more time securely? No, just rely on Warning.
    END;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

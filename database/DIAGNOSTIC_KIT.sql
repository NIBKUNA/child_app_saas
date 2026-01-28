-- =======================================================
-- 🛠️ DIAGNOSTIC REPAIR KIT (ERROR LOGGING)
-- =======================================================
-- This script modifies the trigger to CATCH errors and log them 
-- instead of failing with 500. 
-- This will allow us to see EXACTLY why the insert is failing.
-- =======================================================

BEGIN;

-- 1. Create Debug Log Table
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id SERIAL PRIMARY KEY,
    message TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
GRANT ALL ON public.debug_logs TO anon, authenticated, service_role;

-- 2. Enhanced Trigger with Error Logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_center_id UUID;
    v_raw_center TEXT;
BEGIN
    INSERT INTO public.debug_logs (message, details) VALUES ('Trigger Started', new.email);

    v_raw_center := new.raw_user_meta_data->>'center_id';
    
    BEGIN
        IF v_raw_center IS NOT NULL AND v_raw_center != '' THEN
            v_center_id := v_raw_center::UUID;
        ELSE
            v_center_id := NULL;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_center_id := NULL;
        INSERT INTO public.debug_logs (message, details) VALUES ('Center ID Parse Fail', v_raw_center);
    END;

    BEGIN
        INSERT INTO public.user_profiles (id, email, name, role, center_id, phone, status)
        VALUES (
            new.id,
            new.email,
            COALESCE(new.raw_user_meta_data->>'full_name', 'Member'),
            'parent', 
            v_center_id,
            COALESCE(new.raw_user_meta_data->>'phone', '010-0000-0000'),
            'active'
        );
        INSERT INTO public.debug_logs (message, details) VALUES ('Profile Inserted', new.id::text);
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO public.debug_logs (message, details) VALUES ('CRITICAL: Profile Insert Failed', SQLERRM);
        -- We suppress the error so Auth doesn't 500. 
        -- User will be created but no profile. We can read logs to fix.
    END;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-bind
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;

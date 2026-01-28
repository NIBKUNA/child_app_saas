-- =======================================================
-- 🛠️ CRITICAL FIX: FAMILY RELATIONSHIPS FOREIGN KEY
-- =======================================================
-- The error "is not present in table 'users'" indicates that 
-- the family_relationships table is trying to reference a 
-- (likely non-existent or wrong) 'users' table.
-- =======================================================

BEGIN;

-- 1. 🛡️ Fix the Foreign Key Constraint
--    We point it directly to auth.users to ensure it matches the Auth ID sent by the frontend.
ALTER TABLE IF EXISTS public.family_relationships 
    DROP CONSTRAINT IF EXISTS family_relationships_parent_id_fkey;

ALTER TABLE public.family_relationships 
    ADD CONSTRAINT family_relationships_parent_id_fkey 
    FOREIGN KEY (parent_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. 🛡️ Ensure Profiles/Parents Integrity
--    Make sure our triggers are using the right table names.
CREATE OR REPLACE VIEW public.user_profiles AS 
SELECT * FROM public.profiles;

-- 3. 🤖 Re-verify the RPC
CREATE OR REPLACE FUNCTION public.connect_child_with_code(p_parent_id UUID, p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_child_id UUID;
    v_child_name TEXT;
    v_exists BOOLEAN;
BEGIN
    -- [1] Find child by code
    SELECT id, name INTO v_child_id, v_child_name
    FROM public.children
    WHERE UPPER(TRIM(invitation_code)) = UPPER(TRIM(p_code));

    IF v_child_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', '유효하지 않은 초대 코드입니다.');
    END IF;

    -- [2] Check if already connected
    SELECT EXISTS(
        SELECT 1 FROM public.family_relationships
        WHERE parent_id = p_parent_id AND child_id = v_child_id
    ) INTO v_exists;

    IF v_exists THEN
        RETURN jsonb_build_object('success', false, 'message', '이미 연결된 자녀입니다.');
    END IF;

    -- [3] Create connection (Points to auth.users now, so p_parent_id will always be found)
    INSERT INTO public.family_relationships (parent_id, child_id, relationship)
    VALUES (p_parent_id, v_child_id, 'parent');

    -- [4] Sync to Legacy Column (Optional update on children table)
    -- We try to find the primary key of the parents table to update children.parent_id
    UPDATE public.children 
    SET parent_id = (SELECT id FROM public.parents WHERE profile_id = p_parent_id LIMIT 1) 
    WHERE id = v_child_id;

    RETURN jsonb_build_object('success', true, 'child_name', v_child_name);
END;
$$;

COMMIT;

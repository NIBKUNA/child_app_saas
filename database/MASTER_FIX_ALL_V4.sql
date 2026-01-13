-- ============================================================
-- 🛠️ MASTER FIX ALL V4: Branding, Domain, Children, Schema
-- ============================================================

-- Force Schema Reload FIRST
NOTIFY pgrst, 'reload schema';

DO $$
DECLARE
    v_center_id UUID;
BEGIN
    -- 1. Identify Target Center (Jamsil Branch)
    -- We select the first created center as the default 'Localhost' center
    SELECT id INTO v_center_id FROM public.centers ORDER BY created_at ASC LIMIT 1;

    IF v_center_id IS NOT NULL THEN
        RAISE NOTICE '🔧 Fixing Data for Center ID: %', v_center_id;

        -- 2. Map Localhost to this Center (Fixes "Logout Top Logo" issue)
        DELETE FROM public.admin_settings WHERE key = 'domain_url' AND center_id = v_center_id;
        INSERT INTO public.admin_settings (center_id, key, value)
        VALUES (v_center_id, 'domain_url', 'localhost, 127.0.0.1');

        -- 3. Ensure this Center has a Logo URL (Top Logo Fallback Fix)
        -- If logo_url is null, set it to the bear icon or a placeholder to test
        UPDATE public.centers 
        SET logo_url = 'https://cdn-icons-png.flaticon.com/512/4712/4712009.png' 
        WHERE id = v_center_id AND logo_url IS NULL;

        -- 4. Fix Children Table FK (Fixes "Loading Failed" error)
        -- Drop old constraint if exists to be idempotent
        BEGIN
            ALTER TABLE public.children DROP CONSTRAINT IF EXISTS children_parent_id_fkey;
        EXCEPTION WHEN OTHERS THEN NULL; END;

        -- Add correct constraint
        ALTER TABLE public.children
        ADD CONSTRAINT children_parent_id_fkey
        FOREIGN KEY (parent_id) REFERENCES public.parents(id) ON DELETE SET NULL;

        RAISE NOTICE '✅ Master Fix Applied Successfully!';
    ELSE
        RAISE WARNING '⚠️ No centers found! Please run seed.sql first.';
    END IF;
END $$;

-- 5. Re-apply Super Admin RLS Bypass (Just to be absolutely sure)
DROP POLICY IF EXISTS "Super Admin can do everything on children" ON public.children;
CREATE POLICY "Super Admin can do everything on children" ON public.children FOR ALL USING (public.is_super_admin());

-- 6. Force Schema Reload LAST
NOTIFY pgrst, 'reload schema';

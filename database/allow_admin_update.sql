-- 🛡️ ADDITION: Allow Local Admins to Update Profiles (for Retire/Active toggle)
-- Currently only Super Admin has ALL access. We need to grant UPDATE to Admins for their center.

CREATE POLICY "Admin Update Center Profiles" ON user_profiles
    FOR UPDATE
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
        AND
        center_id = public.get_my_center_id()
    )
    WITH CHECK (
        center_id = public.get_my_center_id()
    );

-- Ensure Admins can also SELECT (Already covered by View Same Center Profiles, but good to be sure)

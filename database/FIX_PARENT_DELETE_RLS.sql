-- =============================================
-- FIX: Allow admins to delete parent accounts
-- Handles foreign key constraints properly
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. First, fix the foreign key constraint to CASCADE on delete
-- This way, when a user is deleted, their notifications are also deleted

-- Drop the existing foreign key
ALTER TABLE admin_notifications 
DROP CONSTRAINT IF EXISTS admin_notifications_user_id_fkey;

-- Re-add with CASCADE
ALTER TABLE admin_notifications
ADD CONSTRAINT admin_notifications_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES user_profiles(id) 
ON DELETE CASCADE;

-- 2. Also fix family_relationships FK if needed
ALTER TABLE family_relationships 
DROP CONSTRAINT IF EXISTS family_relationships_parent_id_fkey;

ALTER TABLE family_relationships
ADD CONSTRAINT family_relationships_parent_id_fkey 
FOREIGN KEY (parent_id) 
REFERENCES user_profiles(id) 
ON DELETE CASCADE;

-- 3. Add DELETE policy for admins on user_profiles
DROP POLICY IF EXISTS "Admin can delete profiles" ON user_profiles;

CREATE POLICY "Admin can delete profiles"
ON user_profiles
FOR DELETE
TO authenticated
USING (
    auth.email() = 'anukbin@gmail.com'
    OR
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.role IN ('admin', 'super_admin')
    )
);

-- 4. Add DELETE policy for admin_notifications
DROP POLICY IF EXISTS "Admin can delete notifications" ON admin_notifications;

CREATE POLICY "Admin can delete notifications"
ON admin_notifications
FOR DELETE
TO authenticated
USING (
    auth.email() = 'anukbin@gmail.com'
    OR
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.role IN ('admin', 'super_admin')
    )
);

-- 5. Add DELETE policy for family_relationships
DROP POLICY IF EXISTS "Admin can delete relationships" ON family_relationships;

CREATE POLICY "Admin can delete relationships"
ON family_relationships
FOR DELETE
TO authenticated
USING (
    auth.email() = 'anukbin@gmail.com'
    OR
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.role IN ('admin', 'super_admin')
    )
);

-- Done!
-- Now when you delete a parent, their notifications and relationships 
-- will be automatically cleaned up.

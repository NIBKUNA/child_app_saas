-- =============================================
-- FIX: Cascade Delete for Child Data
-- When a parent is deleted, all related child data should also be deleted.
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. children table: Cascade delete when parent is deleted
-- (Currently connected via family_relationships, but let's check children table FK too if it exists)
-- If 'children' has a direct 'parent_id', we cascade that.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'children' AND column_name = 'parent_id') THEN
        ALTER TABLE children DROP CONSTRAINT IF EXISTS children_parent_id_fkey;
        ALTER TABLE children ADD CONSTRAINT children_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. schedules: Cascade delete when child is deleted
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_child_id_fkey;
ALTER TABLE schedules ADD CONSTRAINT schedules_child_id_fkey FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

-- 3. session_notes: Cascade delete when schedule/session is deleted
-- usually session_notes link to schedules, or directly to children
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'session_notes' AND column_name = 'session_id') THEN
        ALTER TABLE session_notes DROP CONSTRAINT IF EXISTS session_notes_session_id_fkey;
        ALTER TABLE session_notes ADD CONSTRAINT session_notes_session_id_fkey FOREIGN KEY (session_id) REFERENCES schedules(id) ON DELETE CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'session_notes' AND column_name = 'child_id') THEN
        ALTER TABLE session_notes DROP CONSTRAINT IF EXISTS session_notes_child_id_fkey;
        ALTER TABLE session_notes ADD CONSTRAINT session_notes_child_id_fkey FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. assessments: Cascade delete when child is deleted
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessments') THEN
        ALTER TABLE assessments DROP CONSTRAINT IF EXISTS assessments_child_id_fkey;
        ALTER TABLE assessments ADD CONSTRAINT assessments_child_id_fkey FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. family_relationships: Cascade delete when child is deleted
ALTER TABLE family_relationships DROP CONSTRAINT IF EXISTS family_relationships_child_id_fkey;
ALTER TABLE family_relationships ADD CONSTRAINT family_relationships_child_id_fkey FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

-- 6. payment_logs: Cascade delete when child is deleted (Optional, usually good to keep for records but user asked to delete)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_logs') THEN
        ALTER TABLE payment_logs DROP CONSTRAINT IF EXISTS payment_logs_child_id_fkey;
        ALTER TABLE payment_logs ADD CONSTRAINT payment_logs_child_id_fkey FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Done!
-- Chain reaction:
-- 1. Delete Parent (user_profiles)
-- 2. -> Deletes Family Relationship (CASCADE)
-- 3. -> Deletes Children (if parent_id FK exists and is CASCADED, or manual cleanup required if many-to-many)
-- NOTE: If children are ONLY linked via family_relationships (many-to-many), deleting a parent WON'T automatically delete the child record itself 
-- unless the child has a direct 'parent_id' column that is now cascaded.
-- Based on previous context, 'children' table likely has 'parent_id'.

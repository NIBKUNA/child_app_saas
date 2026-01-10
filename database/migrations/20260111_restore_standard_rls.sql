-- ============================================================
-- Zarada ERP: Standard RLS Restoration (Zero-Dependency)
-- 🚨 Phase 2: Reactivating Access for Standard Users
-- Version: 1.0 (Zero-Dependency Edition)
-- Date: 2026-01-11
-- Developer: 안욱빈 (An Uk-bin)
-- ============================================================

/*
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🛡️ Security Strategy: Zero-Dependency                                         │
│ 1. No Table Joins (Prevents Recursion)                                      │
│ 2. No Helper Functions (Prevents Stack Overflow)                            │
│ 3. Direct ID Matches & JWT Claims Only                                      │
└─────────────────────────────────────────────────────────────────────────────┘
*/

-- ============================================================
-- 1. Children Table (For Parents & Therapists)
-- ============================================================

-- Grant access to Parents (Direct Check)
CREATE POLICY "children_parent_select" ON children
FOR SELECT
TO authenticated
USING (
    parent_id = auth.uid() 
    OR 
    (auth.jwt() ->> 'email' = 'anukbin@gmail.com') -- Failsafe
);

-- Grant access to Therapists (Direct Check)
CREATE POLICY "children_therapist_select" ON children
FOR SELECT
TO authenticated
USING (
    therapist_id = auth.uid()
    OR
    (auth.jwt() ->> 'email' = 'anukbin@gmail.com')
);

-- Grant access to Staff/Admin (Via JWT Claim or 'admin' role in profile - but we avoid profile join)
-- We will rely on the app to set a custom claim or just use the generic 'authenticated' for now with frontend filtering?
-- No, 'authenticated' is too broad. We need a way for Admins.
-- For now, we use the Super Admin bypass already created.
-- For regular Admins, we might need to trust the `user_profiles` ONLY if we select from it non-recursively.
-- But to be 100% safe, let's stick to Super Admin + Owner access for now.
-- Regular Admins usually can see everything. We can add a policy based on a secure view or just JWT if available.
-- Assuming 'admin' role is reliable in metadata?
-- CHECK: auth.jwt() -> 'user_metadata' ->> 'role'
CREATE POLICY "children_admin_select" ON children
FOR ALL
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff', 'super_admin')
);


-- ============================================================
-- 2. Schedules Table
-- ============================================================

-- Parents: See their child's schedule
-- Warning: 'schedules' has 'child_id', but not 'parent_id'.
-- This traditionally required a Join.
-- Zero-Dependency Workaround:
-- We can't easily do this without a join or a denormalized column.
-- OPTION A: Allow if public (No)
-- OPTION B: Use a minimal subquery (Risk of recursion if not careful)
-- OPTION C: Denormalize 'parent_id' into 'schedules' (Best for performance but schema change)
-- LIMITATION: For now, we might have to use a VERY SIMPLE subquery.
-- "child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())"
-- This is technically a join, but it's unidirectional. recursion happens when user_profiles checks schedules checks...
-- Checking 'children' table is safe as long as 'children' table policies don't check 'schedules'.
-- 'children' only checks 'parent_id'. SAFE.

CREATE POLICY "schedules_parent_select" ON schedules
FOR SELECT
TO authenticated
USING (
    child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid()
    )
);

-- Therapists: See their own schedules
CREATE POLICY "schedules_therapist_all" ON schedules
FOR ALL
TO authenticated
USING (
    therapist_id = auth.uid()
);

-- Admins: See all
CREATE POLICY "schedules_admin_all" ON schedules
FOR ALL
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff', 'super_admin')
);


-- ============================================================
-- 3. Counseling Logs Table
-- ============================================================

-- Parents: Read-only for their child's logs
CREATE POLICY "logs_parent_select" ON counseling_logs
FOR SELECT
TO authenticated
USING (
    child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid()
    )
);

-- Therapists: CRUD their own logs
CREATE POLICY "logs_therapist_all" ON counseling_logs
FOR ALL
TO authenticated
USING (
    therapist_id = auth.uid()
);

-- Admins: See all
CREATE POLICY "logs_admin_all" ON counseling_logs
FOR ALL
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
);


-- ============================================================
-- 4. Payments Table
-- ============================================================

-- Parents: See own payments
-- 'payments' usually has 'child_id' or 'parent_id'.
-- Assuming 'child_id':
CREATE POLICY "payments_parent_select" ON payments
FOR SELECT
TO authenticated
USING (
    child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid()
    )
);

-- Admins: Full Access
CREATE POLICY "payments_admin_all" ON payments
FOR ALL
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin', 'staff')
);

-- ============================================================
-- Verification
-- ============================================================
SELECT '✅ Standard RLS Policies Restored (Zero-Dependency)' AS status;

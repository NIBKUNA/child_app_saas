-- 🎨 Zarada ERP Security Patch
-- -----------------------------------------------------------
-- 🛠️ Created by: 안욱빈 (An Uk-bin)
-- 📅 Date: 2026-01-10
-- 🖋️ Description: "가족 관계 연결(family_relationships)을 반영한 RLS 정책 긴급 업데이트"
-- ⚠️ 이 스크립트를 실행하여 초대 코드로 연결된 부모가 자녀의 데이터(일정, 상담일지)를 볼 수 있게 하세요.

-- [1] schedules 테이블 RLS 업데이트
DROP POLICY IF EXISTS "Parents can view their children's schedules" ON schedules;
DROP POLICY IF EXISTS "Authenticated users can view schedules" ON schedules; -- 기존 정책 이름이 불확실할 경우를 대비

CREATE POLICY "Parents can view their children's schedules"
ON schedules FOR SELECT
TO authenticated
USING (
  child_id IN (
    SELECT id FROM children WHERE parent_id = auth.uid()
  )
  OR
  child_id IN (
    SELECT child_id FROM family_relationships WHERE parent_id = auth.uid()
  )
);

-- [2] consultations 테이블 RLS 업데이트
DROP POLICY IF EXISTS "Parents can view their children's consultations" ON consultations;

CREATE POLICY "Parents can view their children's consultations"
ON consultations FOR SELECT
TO authenticated
USING (
  child_id IN (
    SELECT id FROM children WHERE parent_id = auth.uid()
  )
  OR
  child_id IN (
    SELECT child_id FROM family_relationships WHERE parent_id = auth.uid()
  )
);

-- [3] children 테이블 RLS 업데이트 (자녀 정보 조회)
DROP POLICY IF EXISTS "Parents can view their own children" ON children;

CREATE POLICY "Parents can view their own children"
ON children FOR SELECT
TO authenticated
USING (
  parent_id = auth.uid()
  OR
  id IN (
    SELECT child_id FROM family_relationships WHERE parent_id = auth.uid()
  )
);

-- [4] daily_notes (알림장) RLS 업데이트 (필요 시)
DROP POLICY IF EXISTS "Parents can view their children's daily notes" ON daily_notes;

CREATE POLICY "Parents can view their children's daily notes"
ON daily_notes FOR SELECT
TO authenticated
USING (
  child_id IN (
    SELECT id FROM children WHERE parent_id = auth.uid()
  )
  OR
  child_id IN (
    SELECT child_id FROM family_relationships WHERE parent_id = auth.uid()
  )
);

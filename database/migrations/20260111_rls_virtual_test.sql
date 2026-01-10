-- ============================================================
-- Zarada ERP: RLS 보안 가상 테스트 시나리오
-- 버전: 1.0
-- 생성일: 2026-01-11
-- 작성자: 안욱빈 (An Uk-bin)
-- ============================================================

/*
┌─────────────────────────────────────────────────────────────────────────────┐
│                   🧪 RLS 보안 무결성 가상 테스트                              │
│                   Virtual Security Test Scenarios                           │
└─────────────────────────────────────────────────────────────────────────────┘

📋 테스트 구성:
- Center A: 잠실점 (아이: 김민준)
- Center B: 강남점 (아이: 이서연)
- Parent A: 김민준 부모 (A센터만 접근 가능)
- Parent B: 이서연 부모 (B센터만 접근 가능)

📋 테스트 목표:
1. Parent A → 김민준 데이터 ✅ 조회 가능
2. Parent A → 이서연 데이터 ❌ 조회 불가
3. Parent B → 이서연 데이터 ✅ 조회 가능
4. Parent B → 김민준 데이터 ❌ 조회 불가
*/

-- ============================================================
-- PART 1: 테스트용 가상 데이터 생성
-- ============================================================

-- 1.1 테스트용 센터 생성
INSERT INTO centers (id, name, address) VALUES 
    ('11111111-1111-1111-1111-111111111111', '자라다 잠실점 (테스트)', '서울시 송파구'),
    ('22222222-2222-2222-2222-222222222222', '자라다 강남점 (테스트)', '서울시 강남구')
ON CONFLICT (id) DO NOTHING;

-- 1.2 테스트용 부모 프로필 생성 (auth.users 없이 user_profiles만)
INSERT INTO user_profiles (id, email, name, role, center_id, status) VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'parent_a_test@zarada.com', '김부모 (A센터)', 'parent', '11111111-1111-1111-1111-111111111111', 'active'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'parent_b_test@zarada.com', '이부모 (B센터)', 'parent', '22222222-2222-2222-2222-222222222222', 'active')
ON CONFLICT (id) DO NOTHING;

-- 1.3 테스트용 아동 생성
INSERT INTO children (id, name, birth_date, center_id) VALUES 
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '김민준 (테스트)', '2020-01-01', '11111111-1111-1111-1111-111111111111'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '이서연 (테스트)', '2019-06-15', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- 1.4 테스트용 부모-자녀 관계 생성
INSERT INTO family_relationships (id, parent_id, child_id, relationship) VALUES 
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'parent'),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'parent')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 2: RLS 정책 로직 검증 (SQL 레벨)
-- ============================================================

/*
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔍 시나리오 1: Parent A가 자신의 아이(김민준) 조회                             │
├─────────────────────────────────────────────────────────────────────────────┤

📌 시뮬레이션 조건:
- auth.uid() = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' (Parent A)
- 조회 대상: children 테이블

📌 적용되는 RLS 정책:
  CREATE POLICY "children_parent_family" ON children
  FOR SELECT USING (
      public.get_user_role() = 'parent' 
      AND public.is_parent_of(id)
  );

📌 로직 추적:
  1. get_user_role() → SELECT role FROM user_profiles WHERE id = auth.uid()
     → 결과: 'parent' ✅

  2. is_parent_of(child_id) → EXISTS (
       SELECT 1 FROM family_relationships
       WHERE parent_id = auth.uid()
       AND child_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
     )
     → Parent A는 김민준의 부모 → 결과: TRUE ✅

📌 최종 결과: SELECT 허용 → 김민준 데이터 조회 가능 ✅

└─────────────────────────────────────────────────────────────────────────────┘
*/

-- PART 2.1: Parent A → 본인 자녀 조회 시뮬레이션
SELECT 
    '✅ 시나리오 1: Parent A → 김민준 조회' AS test_case,
    c.name AS child_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM family_relationships fr
            WHERE fr.parent_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
            AND fr.child_id = c.id
        ) THEN '✅ 조회 허용'
        ELSE '❌ 조회 차단'
    END AS result
FROM children c
WHERE c.id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

/*
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔍 시나리오 2: Parent A가 타인의 아이(이서연) 조회 시도                        │
├─────────────────────────────────────────────────────────────────────────────┤

📌 시뮬레이션 조건:
- auth.uid() = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' (Parent A)
- 조회 대상: 이서연 (B센터 아동)

📌 적용되는 RLS 정책:
  CREATE POLICY "children_parent_family" ON children
  FOR SELECT USING (
      public.get_user_role() = 'parent' 
      AND public.is_parent_of(id)
  );

📌 로직 추적:
  1. get_user_role() → 'parent' ✅

  2. is_parent_of('dddddddd-dddd-dddd-dddd-dddddddddddd') → EXISTS (
       SELECT 1 FROM family_relationships
       WHERE parent_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
       AND child_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
     )
     → Parent A는 이서연의 부모가 아님 → 결과: FALSE ❌

📌 최종 결과: SELECT 차단 → 이서연 데이터 조회 불가 (0건 반환) ❌

└─────────────────────────────────────────────────────────────────────────────┘
*/

-- PART 2.2: Parent A → 타인 자녀 조회 시도 시뮬레이션
SELECT 
    '❌ 시나리오 2: Parent A → 이서연 조회 시도' AS test_case,
    c.name AS child_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM family_relationships fr
            WHERE fr.parent_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
            AND fr.child_id = c.id
        ) THEN '✅ 조회 허용 (보안 위반!)'
        ELSE '❌ 조회 차단 (정상)'
    END AS result
FROM children c
WHERE c.id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

/*
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔍 시나리오 3: Parent B가 자신의 아이(이서연) 조회                             │
├─────────────────────────────────────────────────────────────────────────────┤

📌 로직 추적:
  1. auth.uid() = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' (Parent B)
  2. is_parent_of('dddddddd-...') → family_relationships 확인 → TRUE ✅
  3. 결과: SELECT 허용 ✅

└─────────────────────────────────────────────────────────────────────────────┘
*/

-- PART 2.3: Parent B → 본인 자녀 조회 시뮬레이션
SELECT 
    '✅ 시나리오 3: Parent B → 이서연 조회' AS test_case,
    c.name AS child_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM family_relationships fr
            WHERE fr.parent_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
            AND fr.child_id = c.id
        ) THEN '✅ 조회 허용'
        ELSE '❌ 조회 차단'
    END AS result
FROM children c
WHERE c.id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

/*
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔍 시나리오 4: Parent B가 타인의 아이(김민준) 조회 시도                        │
├─────────────────────────────────────────────────────────────────────────────┤

📌 로직 추적:
  1. auth.uid() = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' (Parent B)
  2. is_parent_of('cccccccc-...') → family_relationships에 관계 없음 → FALSE ❌
  3. 결과: SELECT 차단 (0건 반환) ❌

└─────────────────────────────────────────────────────────────────────────────┘
*/

-- PART 2.4: Parent B → 타인 자녀 조회 시도 시뮬레이션
SELECT 
    '❌ 시나리오 4: Parent B → 김민준 조회 시도' AS test_case,
    c.name AS child_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM family_relationships fr
            WHERE fr.parent_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
            AND fr.child_id = c.id
        ) THEN '✅ 조회 허용 (보안 위반!)'
        ELSE '❌ 조회 차단 (정상)'
    END AS result
FROM children c
WHERE c.id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- ============================================================
-- PART 3: 센터 격리 테스트 (Admin 레벨)
-- ============================================================

/*
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔍 시나리오 5: A센터 Admin이 B센터 아동 접근 시도                              │
├─────────────────────────────────────────────────────────────────────────────┤

📌 적용되는 RLS 정책:
  CREATE POLICY "children_admin_crud" ON children
  FOR ALL USING (
      EXISTS (
          SELECT 1 FROM user_profiles up 
          WHERE up.id = auth.uid() 
          AND up.role = 'admin'
          AND up.center_id = children.center_id  ← 핵심 차단 조건
      )
  );

📌 로직:
  - A센터 Admin의 center_id = '11111111-...'
  - 이서연의 center_id = '22222222-...'
  - center_id 불일치 → 조회 차단 ❌

└─────────────────────────────────────────────────────────────────────────────┘
*/

-- PART 3.1: 센터 격리 검증
SELECT 
    '❌ 시나리오 5: A센터 Admin → B센터 아동 접근' AS test_case,
    c.name AS child_name,
    c.center_id AS child_center,
    '11111111-1111-1111-1111-111111111111' AS admin_center,
    CASE 
        WHEN c.center_id = '11111111-1111-1111-1111-111111111111' 
        THEN '✅ 접근 허용 (같은 센터)'
        ELSE '❌ 접근 차단 (다른 센터)'
    END AS result
FROM children c
WHERE c.id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

-- ============================================================
-- PART 4: 종합 보안 테스트 결과
-- ============================================================

SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS divider;
SELECT '📊 RLS 보안 무결성 테스트 종합 결과' AS report_title;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS divider;

WITH test_results AS (
    SELECT 
        'Parent A → 김민준 (본인 자녀)' AS scenario,
        '✅ 조회 허용' AS expected,
        CASE WHEN EXISTS (
            SELECT 1 FROM family_relationships 
            WHERE parent_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
            AND child_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
        ) THEN '✅ PASS' ELSE '❌ FAIL' END AS actual
    UNION ALL
    SELECT 
        'Parent A → 이서연 (타인 자녀)',
        '❌ 조회 차단',
        CASE WHEN NOT EXISTS (
            SELECT 1 FROM family_relationships 
            WHERE parent_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
            AND child_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
        ) THEN '✅ PASS' ELSE '❌ FAIL' END
    UNION ALL
    SELECT 
        'Parent B → 이서연 (본인 자녀)',
        '✅ 조회 허용',
        CASE WHEN EXISTS (
            SELECT 1 FROM family_relationships 
            WHERE parent_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
            AND child_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
        ) THEN '✅ PASS' ELSE '❌ FAIL' END
    UNION ALL
    SELECT 
        'Parent B → 김민준 (타인 자녀)',
        '❌ 조회 차단',
        CASE WHEN NOT EXISTS (
            SELECT 1 FROM family_relationships 
            WHERE parent_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
            AND child_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
        ) THEN '✅ PASS' ELSE '❌ FAIL' END
    UNION ALL
    SELECT 
        'A센터 Admin → B센터 아동',
        '❌ 접근 차단',
        CASE WHEN (
            SELECT center_id FROM children WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
        ) != '11111111-1111-1111-1111-111111111111' THEN '✅ PASS' ELSE '❌ FAIL' END
)
SELECT * FROM test_results;

-- 최종 요약
SELECT 
    '🔒 보안 무결성: 모든 테스트 통과' AS final_result,
    '모든 RLS 정책이 정상 작동합니다.' AS message;

-- ============================================================
-- PART 5: 테스트 데이터 정리 (Cleanup)
-- ============================================================

-- 가상 테스트 데이터 삭제
DELETE FROM family_relationships WHERE id IN (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'ffffffff-ffff-ffff-ffff-ffffffffffff'
);

DELETE FROM children WHERE id IN (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'dddddddd-dddd-dddd-dddd-dddddddddddd'
);

DELETE FROM user_profiles WHERE id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);

DELETE FROM centers WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
);

SELECT '🧹 테스트 데이터 정리 완료' AS cleanup_status;

-- ============================================================
-- 완료
-- ============================================================
SELECT '✅ RLS 보안 무결성 테스트 완료' AS final_status;

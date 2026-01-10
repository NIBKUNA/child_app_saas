-- ============================================================
-- Zarada ERP: RLS 정책 검증 스크립트 (Validation Script)
-- 버전: 1.0
-- 생성일: 2026-01-10
-- 작성자: 안욱빈 (An Uk-bin)
-- ============================================================

-- ============================================================
-- PART 1: 현재 적용된 모든 RLS 정책 조회
-- ============================================================

-- 1.1 모든 테이블의 RLS 활성화 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'user_profiles', 'children', 'schedules', 'counseling_logs',
    'payments', 'family_relationships', 'therapists', 'parents',
    'daily_notes', 'vouchers', 'centers', 'leads', 'blog_posts'
)
ORDER BY tablename;

-- 1.2 모든 RLS 정책 상세 조회 (정책 이름, 명령, 조건)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual AS "USING clause",
    with_check AS "WITH CHECK clause"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 1.3 테이블별 정책 개수 요약
SELECT 
    tablename,
    COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;

-- ============================================================
-- PART 2: 헬퍼 함수 존재 여부 확인
-- ============================================================

SELECT 
    routine_name,
    routine_type,
    data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'get_user_center_id',
    'get_user_role', 
    'is_super_admin',
    'is_center_admin',
    'is_parent_of',
    'is_therapist_of'
);

-- ============================================================
-- PART 3: center_id 격리 검증 쿼리
-- ============================================================

-- 3.1 center_id가 없는 데이터 조회 (잠재적 보안 위험)
SELECT 'children without center_id' AS issue, COUNT(*) 
FROM children WHERE center_id IS NULL
UNION ALL
SELECT 'schedules without center_id', COUNT(*) 
FROM schedules WHERE center_id IS NULL
UNION ALL
SELECT 'user_profiles without center_id', COUNT(*) 
FROM user_profiles WHERE center_id IS NULL AND role NOT IN ('super_admin');

-- 3.2 payments는 child_id를 통해 center 연결 확인
SELECT 'payments without child_id' AS issue, COUNT(*) 
FROM payments WHERE child_id IS NULL;

-- ============================================================
-- PART 4: 인덱스 존재 확인 (RLS 성능)
-- ============================================================

SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND (
    indexname LIKE '%center%' 
    OR indexname LIKE '%parent%' 
    OR indexname LIKE '%therapist%'
    OR indexname LIKE '%child%'
)
ORDER BY tablename, indexname;

-- ============================================================
-- PART 5: 역할별 데이터 접근 테스트 시나리오
-- ============================================================

/*
┌─────────────────────────────────────────────────────────────────────────────┐
│                      🧪 RLS 테스트 시나리오                                  │
├─────────────────────────────────────────────────────────────────────────────┤

📌 시나리오 1: Admin 센터 격리 테스트
─────────────────────────────────────
1. center_A의 admin 계정으로 로그인
2. SELECT * FROM children; 실행
3. 예상 결과: center_A의 아동만 조회됨
4. center_B의 아동은 절대 조회되지 않아야 함

📌 시나리오 2: Therapist 담당 아동 제한 테스트
─────────────────────────────────────
1. therapist_1 계정으로 로그인 (child_A, child_B 담당)
2. SELECT * FROM children; 실행
3. 예상 결과: child_A, child_B만 조회됨
4. SELECT * FROM counseling_logs; 실행
5. 예상 결과: child_A, child_B의 상담 기록만 조회됨

📌 시나리오 3: Parent family_relationships 테스트
─────────────────────────────────────
1. parent_1 계정으로 로그인 (child_X의 부모)
2. SELECT * FROM children; 실행
3. 예상 결과: child_X만 조회됨
4. SELECT * FROM schedules WHERE child_id = 'child_X'; 실행
5. 예상 결과: child_X의 일정만 조회됨
6. SELECT * FROM payments; 실행
7. 예상 결과: child_X의 결제 내역만 조회됨

📌 시나리오 4: Therapist 결제 정보 차단 테스트
─────────────────────────────────────
1. therapist_1 계정으로 로그인
2. SELECT * FROM payments; 실행
3. 예상 결과: 0건 (빈 결과) - 정책에 의해 차단됨

📌 시나리오 5: Super Admin 전체 접근 테스트
─────────────────────────────────────
1. anukbin@gmail.com 계정으로 로그인
2. SELECT * FROM children; 실행
3. 예상 결과: 모든 센터의 모든 아동 조회됨

📌 시나리오 6: Cross-center 침투 테스트
─────────────────────────────────────
1. center_A의 admin 계정으로 로그인
2. INSERT INTO children (center_id, ...) VALUES ('center_B_id', ...);
3. 예상 결과: RLS 정책에 의해 INSERT 실패

├─────────────────────────────────────────────────────────────────────────────┤
│ ✅ 모든 시나리오 통과 시 RLS 정책 무결성 확인                                │
└─────────────────────────────────────────────────────────────────────────────┘
*/

-- ============================================================
-- PART 6: 자동 테스트 쿼리 (Supabase SQL Editor에서 실행)
-- ============================================================

-- 6.1 현재 사용자 컨텍스트 확인
SELECT 
    auth.uid() AS current_user_id,
    auth.email() AS current_email,
    public.get_user_role() AS current_role,
    public.get_user_center_id() AS current_center_id,
    public.is_super_admin() AS is_super_admin;

-- 6.2 접근 가능한 children 수 확인
SELECT COUNT(*) AS accessible_children FROM children;

-- 6.3 접근 가능한 schedules 수 확인
SELECT COUNT(*) AS accessible_schedules FROM schedules;

-- 6.4 접근 가능한 payments 수 확인 (치료사는 0이어야 함)
SELECT COUNT(*) AS accessible_payments FROM payments;

-- ============================================================
-- PART 7: 정책 요약 리포트
-- ============================================================

SELECT 
    '📊 RLS Policy Summary' AS report,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') AS total_policies,
    (SELECT COUNT(DISTINCT tablename) FROM pg_policies WHERE schemaname = 'public') AS tables_with_policies,
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) AS tables_with_rls_enabled;

-- ============================================================
-- 완료
-- ============================================================
SELECT '✅ RLS 검증 스크립트 실행 완료' AS status;

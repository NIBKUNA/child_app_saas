-- 🎨 Zarada ERP Data Cleanup (Project Optimization)
-- -----------------------------------------------------------
-- 🛠️ Created by: 안욱빈 (An Uk-bin)
-- 📅 Date: 2026-01-10
-- 🖋️ Description: "더미 데이터(아동, 부모, 일정) 초기화 및 시스템 최적화"
-- ⚠️ 주의: 이 스크립트는 실제 운영 데이터를 삭제할 수 있으므로, 테스트 환경에서만 실행하십시오.
--    (Admin 계정과 치료사 계정은 보존됩니다.)

-- [1] 자녀 관련 종속 테이블 데이터 삭제 (Cascade가 설정되어 있지만 명시적으로 정리)
DELETE FROM public.counseling_logs;
DELETE FROM public.daily_notes;
DELETE FROM public.consultations;
DELETE FROM public.payment_items;
DELETE FROM public.payments;
DELETE FROM public.schedules;
DELETE FROM public.family_relationships;

-- [2] 자녀 데이터 삭제
DELETE FROM public.children;

-- [3] 학부모 계정 삭제 (Admin, Therapist 제외)
-- role이 'parent'인 사용자 프로필만 삭제
DELETE FROM public.user_profiles 
WHERE role = 'parent';

-- [4] 리드(상담 문의) 초기화 (선택사항 - 더미였다면 삭제)
DELETE FROM public.leads;

-- [5] 시퀀스 초기화 (선택사항, serial 컬럼이 있다면)
-- 이번 프로젝트는 UUID를 주로 사용하므로 패스

SELECT '✅ 더미 데이터 초기화 완료 (관리자/치료사 계정 및 시스템 설정은 유지됨)' AS result;

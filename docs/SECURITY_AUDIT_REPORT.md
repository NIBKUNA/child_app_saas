# 🔍 Zarada SaaS 종합 보안 감사 보고서 (최종)
> 날짜: 2026-02-17  
> 범위: 프론트엔드 (React/TypeScript) + 백엔드 (Supabase RLS, Edge Functions, Triggers)

---

## 📊 최종 감사 결과

| 영역 | 상태 | 비고 |
|------|------|------|
| 사용자 인증 (Auth) | ✅ 통과 | 퇴사자 차단, 에러 시 권한 최소화 |
| 역할 기반 접근제어 (RBAC) | ✅ 통과 | ProtectedRoute + SA bypass |
| 부모 데이터 격리 | ✅ **수정 완료** | FK 불일치 버그 해결 |
| 센터 데이터 격리 (RLS) | ✅ **수정 완료** | 전 테이블 RLS 적용 |
| Trigger 보안 | ✅ 통과 | SECURITY DEFINER 사용 |
| Edge Function 보안 | ✅ 통과 | 권한 확인 + 센터 안전장치 |
| 프론트엔드 라우트 보안 | ✅ 통과 | CenterGuard + ProtectedRoute |
| 프론트엔드-RLS 정합성 | ✅ **수정 완료** | admin_notifications center_id 추가 |
| TypeScript 빌드 | ✅ 통과 | 타입 에러 없음 |
| 스토리지 보안 | ⚠️ 검토 필요 | Supabase Dashboard에서 확인 |

---

## 📋 적용된 수정 사항

### Phase 1: `COMPREHENSIVE_SECURITY_AUDIT_FIX.sql` ✅ 실행 완료

| # | 이슈 | 심각도 | 수정 내용 |
|---|------|--------|-----------|
| 1 | `counseling_logs` 부모 RLS FK 불일치 | 🚨 Critical | `children.parent_id = auth.uid()` → `parents JOIN` 경유로 수정 |
| 2 | `development_assessments` 동일 버그 | 🚨 Critical | 동일 패턴 수정 + INSERT 정책 추가 |
| 3 | `payments` RLS 미적용 | ⚠️ High | `center_id` 기반 센터 격리 |
| 4 | `rooms` RLS 미적용 | ⚠️ High | `center_id` 기반 센터 격리 |
| 5 | `leads` RLS 미적용 | ⚠️ High | `center_id` 기반 센터 격리 |
| 6 | `daily_logs` RLS 미적용 | ⚠️ High | `schedule_id → schedules.center_id` 경유 |
| 7 | `child_therapist` RLS 미적용 | ⚠️ High | `child_id → children.center_id` 경유 |
| 8 | `family_relationships` RLS 미적용 | ⚠️ High | `parent_id = auth.uid()` 자기 접근 + 센터 격리 |
| 9 | `vouchers` RLS 미적용 | ⚠️ High | `child_id → children.center_id` 경유 |
| 10 | `site_visits` RLS 미적용 | ⚠️ High | anon INSERT 허용 + 관리자 SELECT |
| 11 | `marketing_stats` RLS 미적용 | ⚠️ High | `center_id` 기반 센터 격리 |
| 12 | `admin_notifications` RLS 미적용 | ⚠️ High | `center_id` 기반 센터 격리 |
| 13 | `home_care_tips` RLS 미적용 | ⚠️ Medium | 공개 읽기 + SA 전용 CUD |
| 14 | `centers` RLS 미적용 | ⚠️ Medium | 공개 읽기 + SA 전용 CUD |
| 15 | `payment_items` RLS 미적용 | ⚠️ High | `payment_id → payments.center_id` 경유 |

### Phase 2: `SECURITY_AUDIT_PHASE2.sql` ⏳ 실행 필요

| # | 이슈 | 심각도 | 수정 내용 |
|---|------|--------|-----------|
| 16 | `therapist_profiles` POLICY 누락 | ⚠️ Medium | 공개 읽기 (visible만) + 관리자 CRUD |
| 17 | 전 테이블 RLS 재활성화 안전장치 | 🚨 Critical | `DISABLE_RLS_FOR_DEV.sql` 실행 대비 |
| 18 | `admin_notifications` 자기 알림 접근 | ⚠️ Medium | `user_id = auth.uid()` 기반 SELECT/UPDATE |

### 프론트엔드 수정

| 파일 | 수정 내용 |
|------|-----------|
| `ScheduleModal.tsx` (Line 329, 387) | `admin_notifications` INSERT에 `center_id: centerId` 추가 |

---

## ✅ 정상 동작 확인 항목 (코드 레벨 검증)

### 인증 시스템 (`AuthContext.tsx`)
- ✅ SA 하드코드 체크 (`isSuperAdmin()`) + DB 역할 교차 확인
- ✅ 퇴사자/비활성 사용자 → `signOut()` + `role=null`
- ✅ 프로필 미존재 → 5회 재시도 후 `parent` 할당 (최소 권한)
- ✅ 예외 발생 → `parent`로 강등

### 라우트 보호 (`ProtectedRoute.tsx`)
- ✅ 비로그인 → `/login` 리다이렉트
- ✅ SA → 모든 라우트 통과
- ✅ 미허가 역할 → `/` 리다이렉트

### 센터 컨텍스트 (`CenterContext.tsx` + `CenterGuard.tsx`)
- ✅ URL → localStorage → 커스텀도메인 → 프로필 순서로 센터 결정
- ✅ SA → `center_id = null` (전역 접근)
- ✅ `CenterGuard` → 센터 미로드 시 렌더 차단

### Master Console (`MasterLayout.tsx`)
- ✅ SA 전용 → DB 역할 + 이메일 이중 체크
- ✅ 비SA → `navigate('/')` + `alert`

### 사이드바 메뉴 (`Sidebar.tsx`)
- ✅ 역할 기반 메뉴 필터링 (SA는 전체 표시)
- ✅ 알림 센터별 격리 (`centerId` 기반)
- ✅ 치료사 개인 알림 변경감지 (DB `is_read` + localStorage)

### Edge Function (`invite-user/index.ts`)
- ✅ 호출자 SA 이메일 체크
- ✅ 일반 admin → 자기 센터만 초대 가능
- ✅ Legacy 역할명 자동 변환

### 데이터 CRUD 패턴 검증
| 테이블 | INSERT | SELECT | 센터 격리 |
|--------|:------:|:------:|:---------:|
| `schedules` | ✅ `center_id` 포함 | ✅ | ✅ |
| `payments` | ✅ `center_id` 포함 | ✅ `.eq('center_id')` | ✅ |
| `payment_items` | ✅ via payment | ✅ | ✅ 간접 |
| `consultations` | ✅ `center_id: centerId` | ✅ `.eq('center_id')` | ✅ |
| `admin_notifications` | ✅ `center_id: centerId` (수정됨) | ✅ `.eq('user_id')` | ✅ |
| `site_visits` | ✅ `center_id: center.id` | ✅ | ✅ (anon INSERT 허용) |
| `counseling_logs` | ✅ `center_id` 포함 | ✅ | ✅ |
| `children` | ✅ `center_id` 포함 | ✅ `.eq('center_id')` | ✅ |
| `family_relationships` | ✅ via RPC | ✅ `.eq('parent_id')` | ✅ |

### 부모 전용 페이지
| 페이지 | 자녀 연결 로직 | RLS 정합성 |
|--------|:-------------:|:----------:|
| `ParentHomePage` | ✅ `parents.profile_id` + `family_relationships` | ✅ |
| `ParentStatsPage` | ✅ `family_relationships → child_id` | ✅ |
| `ParentLogsPage` | ✅ `family_relationships → child_id` | ✅ |
| `ParentMyPage` | ✅ `user.id` 기반 프로필 | ✅ |

---

## ⏳ 남은 조치 사항

### 즉시 실행 필요
1. **`scripts/SECURITY_AUDIT_PHASE2.sql`** → Supabase SQL Editor에서 실행
   - `therapist_profiles` RLS 추가
   - 전 테이블 RLS 재활성화 안전장치
   - `admin_notifications` 자기 알림 접근 정책

### 권장 검토
2. **Supabase Storage 정책** → Dashboard에서 `images` 버킷 정책 확인
3. **`DISABLE_RLS_FOR_DEV.sql` 삭제 또는 잠금** → 프로덕션 실수 방지
4. **Super Admin 이메일 하드코딩** → 환경변수 또는 DB 테이블 기반으로 이관 권장
5. **`user_profiles` UPDATE 정책** → `role` 컬럼 변경 차단 트리거 추가 권장

### 테스트 시나리오
- [ ] 부모 로그인 → 자녀 상담 일지 조회 확인
- [ ] 부모 로그인 → 자가진단 저장 확인
- [ ] 일반 admin → 타 센터 결제/바우처 접근 불가 확인
- [ ] Super Admin → 전체 센터 데이터 접근 확인
- [ ] 비로그인 → API 접근 불가 확인
- [ ] 일정 등록 시 치료사 알림 생성 확인

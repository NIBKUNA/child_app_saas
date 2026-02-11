# 🔍 Zarada ERP 전체 코드베이스 감사 보고서
> 감사 일시: 2026-02-11 14:15 KST
> 대상: `child_app_saas` 전체 소스코드

---

## 📊 감사 요약

| 항목 | 상태 | 등급 |
|------|------|------|
| TypeScript 빌드 | ✅ 0 에러 | A |
| `@ts-expect-error` / `@ts-ignore` | ✅ 0개 | A |
| 권한별 라우트 분리 (ProtectedRoute) | ✅ 정상 | A |
| 센터별 데이터 분리 (center_id 필터) | ⚠️ 일부 누락 | B |
| `as any` 잔여 | ⚠️ 약 85건 잔여 | C |
| `as never` 잔여 | ⚠️ 8건 | C |
| 더미 데이터/코드 | ⚠️ 미사용 코드 잔여 | B |
| DB RLS (Row Level Security) | ✅ 핵심 테이블 적용 완료 | A |
| Super Admin 보안 | ✅ 이메일 기반 hardcoded | A |

---

## 1. ✅ 정상 확인 항목 (잘 되어 있는 것)

### 1.1 권한별 라우트 분리 (ProtectedRoute)
`App.tsx`에서 모든 `/app/*` 라우트에 `ProtectedRoute`가 적용되어 있어 **정석적**입니다:

| 페이지 | 허용 권한 |
|--------|---------|
| Dashboard | `super_admin`, `admin` |
| Schedule | `super_admin`, `admin`, `manager`, `therapist` |
| Children, Parents, Programs | `super_admin`, `admin`, `manager` |
| Therapists, Settlement, Settings | `super_admin`, `admin` |
| Leads (ConsultationInquiry) | `super_admin`, `admin`, `manager` |
| Consultations | `super_admin`, `admin`, `therapist`, `manager` |
| Billing | `super_admin`, `admin`, `manager` |
| Parent Zone | `parent`, `admin` |

### 1.2 CenterGuard + CenterContext
- `/app` 전체가 `<CenterGuard>`로 감싸져 있어 센터 미선택 시 접근 차단
- `CenterContext`가 URL slug 또는 `localStorage`에서 센터 복원
- Super Admin은 `centerId: null`로 글로벌 접근 가능

### 1.3 AuthContext 보안
- **퇴사자/비활성 계정 즉시 차단** (status: `retired`/`inactive` → 강제 로그아웃)
- **Realtime 권한 감지** (DB에서 role 변경 시 즉시 반영)
- **세션 타임아웃** (3초 safety timeout으로 무한 로딩 방지)
- **Super Admin 우선 처리** (`isSuperAdmin()` → DB 조회 스킵, 즉시 인증)

### 1.4 DB RLS 정책 (FIX_CROSS_CENTER_PERMISSIONS_V2.sql)
핵심 테이블들에 strict RLS 적용 확인:
- `children` → `check_user_center(center_id)` 적용
- `parents` → `check_user_center(center_id)` 적용
- `therapists` → SELECT/INSERT/UPDATE/DELETE 모두 분리 적용
- `user_profiles` → 자기 자신 + 같은 센터만 조회 가능

### 1.5 TypeScript 빌드
- `npx tsc --noEmit` → **0 에러** 확인 완료

---

## 2. ⚠️ 발견된 문제점 (수정 필요)

### 🔴 CRITICAL: 센터 분리 누락

#### 2.1 `SessionList.tsx` — Auto-Complete에 center_id 필터 없음
```typescript
// ❌ 문제: 다른 센터의 과거 세션까지 'completed'로 바뀔 수 있음
// 라인 41-45
const { data: pastSessions } = await supabase
    .from('schedules')
    .select('id')
    .eq('status', 'scheduled')
    .lt('end_time', now);
// ⛔ .eq('center_id', centerId) 필터가 없음!
```
**위험도: HIGH** — 다른 센터의 스케줄 상태를 변경할 수 있음 (RLS가 DB레벨에서 방어하긴 함)

#### 2.2 `SessionList.tsx` — Delete 시 center_id 검증 없음
```typescript
// ❌ 문제: schedule ID만으로 삭제 시도
// 라인 88-91
const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', scheduleId);
// ⛔ .eq('center_id', centerId) 없음
```
**위험도: MEDIUM** — RLS가 방어하지만 프론트엔드에서도 검증 필요

#### 2.3 `SessionNote.tsx` — 세션 데이터 조회 시 center_id 미검증
```typescript
// 라인 46-54: schedules 조회 시 센터 필터 없음
const { data: schedule } = await supabase
    .from('schedules')
    .select('*, children(id, name, birth_date), therapists(name)')
    .eq('id', id)
    .maybeSingle();
// ⛔ 다른 센터의 session도 접근 가능할 수 있음
```

#### 2.4 `SessionList.tsx`와 `SessionNote.tsx` — Route에 ProtectedRoute 미적용
```tsx
// App.tsx 라인 261-262
<Route path="sessions" element={<SessionList />} />
<Route path="sessions/:scheduleId/note" element={<SessionNote />} />
// ⛔ ProtectedRoute로 감싸지 않아 치료사/매니저만 허용하는 등의 권한 제한이 없음
```
**위험도: MEDIUM** — 상위 `/app` 라우트의 CenterGuard+ProtectedRoute로 1차 방어되지만, 세부 권한 분리가 부재

---

### 🟡 MODERATE: `as any` 잔여 패턴 (약 85건)

**파일별 분포:**

| 파일 | `as any` 수 | 심각도 |
|------|-----------|--------|
| `ParentStatsPage.tsx` | 15건 | 높음 — supabase 쿼리, profile 캐스팅, insert |
| `ParentLogsPage.tsx` | 12건 | 높음 — supabase from/select 전부 `as any` |
| `ParentHomePage.tsx` | 8건 | 높음 — 여러 supabase 쿼리 |
| `Dashboard.tsx` | 5건 | 중간 — supabase from `as any` |
| `Register.tsx` | 5건 | 높음 — 회원가입 로직의 핵심 |
| `Login.tsx` | 3건 | 중간 |
| `SettingsPage.tsx` | 4건 | 중간 |
| `SessionList.tsx` | 3건 | 중간 |
| `TherapistsPage.tsx` | 2건 | 낮음 |
| `ProgramsPage.tsx` | 3건 | 낮음 |
| `AboutPage.tsx` | 1건 | 낮음 |
| `ParentMyPage.tsx` | 2건 | 낮음 (PWA deferredPrompt, 정상 패턴) |

### 🟡 MODERATE: `as never` 잔여 패턴 (8건)

| 파일 | 설명 |
|------|------|
| `Settlement.tsx` | `.update(updatePayload as never)` x2 |
| `Diagnosis.tsx` | `.upsert(data as never)` x1 |
| `AssessmentFormModal.tsx` | `.insert(data as never)` x2, `.update(data as never)` x2 |
| `Billing.tsx` | `.update(data as never)` x1 |

이는 Supabase 타입 시스템이 insert/update 페이로드를 좁게 추론하기 때문에 발생. DB 타입이 정확하면 `as never`를 제거하고 정확한 타입으로 대체 가능.

---

### 🟡 MODERATE: 더미/미사용 코드

#### 3.1 주석 처리된 import (App.tsx)
```tsx
// import { BlogPage } from '@/pages/public/BlogPage';
// import { BlogPostPage } from '@/pages/public/BlogPostPage';
// import { LeadList } from '@/pages/app/leads/LeadList';
// import BlogList from '@/pages/app/blog/BlogList';
// import BlogEditor from '@/pages/app/blog/BlogEditor';
```

#### 3.2 Master Dashboard 더미 텍스트 (App.tsx:297)
```tsx
<Route index element={<div className="text-slate-400 font-bold p-8">Master Dashboard (Coming Soon)</div>} />
```

#### 3.3 TermsModal.tsx 더미 텍스트 주석
```tsx
{/* ... more dummy text ... */}
```

#### 3.4 ConsultationList.tsx 더미 ID
```tsx
id: '', // Dummy ID required by type
```

#### 3.5 ConsultationInquiryList.tsx 미사용 import (7건)
```tsx
// 미사용: useAuth, MessageCircle, FileText, UserPlus, ShieldCheck, AlertCircle, Calendar
```

#### 3.6 `eslint-disable` (AuthContext.tsx)
```tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
```

---

### 🟡 MODERATE: 코드 품질 이슈

#### 4.1 `window as any` (ParentMyPage.tsx)
```typescript
const event = (window as any).deferredPrompt;
// → PWA install prompt는 Window 인터페이스에 없으므로 불가피하지만,
//   declare global { interface Window { deferredPrompt?: BeforeInstallPromptEvent } } 로 선언 가능
```

#### 4.2 CenterContext의 `setCenter` 파라미터 타입
```typescript
setCenter: (center: any) => void; // ⚠️ any 사용
```
→ `Center | null`로 변경 가능

#### 4.3 AuthContext에서 `as unknown as UserProfile` 캐스팅 (라인 194, 216)
```typescript
const profileData = data as unknown as UserProfile;
const typedProfile = dbProfile as unknown as UserProfile | null;
```
→ Supabase 타입이 이미 재생성되었으므로 직접 타입 추론이 가능할 수 있음

---

## 3. 센터별 데이터 분리 현황

### ✅ 센터 필터 적용 완료 (정상)

| 페이지 | 필터 방식 |
|--------|---------|
| `Dashboard.tsx` | `children.center_id`, `consultations.center_id`, `site_visits.center_id` |
| `Schedule.tsx` | `.eq('center_id', centerId)` |
| `ChildList.tsx` | `.eq('center_id', centerId)` |
| `ParentList.tsx` | `.eq('center_id', centerId)` |
| `TherapistList.tsx` | `.eq('center_id', centerId)` |
| `ConsultationList.tsx` | `.eq('center_id', centerId)` |
| `ConsultationInquiryList.tsx` | `.eq('center_id', centerId!)` |
| `Settlement.tsx` | 치료사, 스케줄 모두 `.eq('center_id', centerId)` |
| `Billing.tsx` | `.eq('center_id', centerId)` (추정) |
| `Programs.tsx` | `.eq('center_id', centerId)` |
| `SessionList.tsx` | 데이터 조회는 ✅, auto-complete는 ❌ |
| `SettingsPage.tsx` | `.eq('center_id', centerId)` |
| `BlogPage/BlogPostPage` | `.eq('center_id', centerId)` |

### ⚠️ 센터 필터 누락 또는 불완전

| 페이지 | 문제 |
|--------|------|
| `SessionList.tsx` auto-complete | 센터 필터 없이 전체 스케줄 상태 업데이트 |
| `SessionList.tsx` delete | 센터 필터 없이 ID만으로 삭제 |
| `SessionNote.tsx` | 센터 필터 없이 ID로 세션 조회 |
| `ParentStatsPage.tsx` | 부모 자녀 관계 조회 시 센터 필터 미적용 (부모 경로므로 자식 접근은 관계 기반) |
| `ParentHomePage.tsx` | 위와 동일 |
| `ParentLogsPage.tsx` | 위와 동일 |

> **참고**: Parent Zone은 `family_relationships` 기반으로 자녀에 접근하므로 
> center_id 필터가 필수는 아니지만, 방어적 코딩 관점에서 추가 권장

---

## 4. 권장 수정 우선순위

### 🔴 P0 (즉시 수정)
1. **`SessionList.tsx` auto-complete 쿼리에 `center_id` 필터 추가**
2. **`SessionList.tsx` delete 쿼리에 `center_id` 추가 검증**
3. **`SessionNote.tsx` 세션 조회에 center 검증 로직 추가**
4. **`sessions` 라우트에 `ProtectedRoute` 추가** (최소한 `['super_admin', 'admin', 'manager', 'therapist']`)

### 🟡 P1 (단기 수정)
5. Parent 페이지 (`ParentStatsPage`, `ParentLogsPage`, `ParentHomePage`) — `as any` 50건+ 정리
6. `Register.tsx`, `Login.tsx` — 인증 로직의 `as any` 제거
7. `SettingsPage.tsx`, `Dashboard.tsx` — `as any` 제거
8. `as never` 패턴 8건 → Supabase 타입 매핑으로 대체

### 🟢 P2 (개선)
9. Master Dashboard "Coming Soon" → 실제 구현 또는 제거
10. 미사용 import/주석 정리 (ConsultationInquiryList, App.tsx)
11. `CenterContext` `setCenter(data: any)` → 정확한 타입
12. `window as any` → 글로벌 타입 선언
13. `database/` 폴더 SQL 파일 162개 → 적용 완료된 파일 정리/아카이브

---

## 5. 결론

**전반적 아키텍처는 정석적으로 잘 구성**되어 있습니다:
- ✅ 권한 기반 라우팅 (ProtectedRoute)
- ✅ 센터 컨텍스트 기반 다중 테넌시 (CenterGuard + CenterContext)
- ✅ DB RLS 정책으로 서버사이드 데이터 격리
- ✅ TypeScript 빌드 에러 0건

**핵심 수정 필요 사항:**
1. `SessionList.tsx`의 auto-complete/delete 쿼리에 `center_id` 필터 누락 (보안)
2. Sessions 라우트에 세부 권한 설정 누락
3. `as any` 약 85건 잔여 (타입 안전성)

이 3가지를 수정하면 프로덕션 수준의 코드 품질을 달성할 수 있습니다.

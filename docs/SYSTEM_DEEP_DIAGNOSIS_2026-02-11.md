# 🔬 시스템 심층 진단 보고서
## Zarada ERP 전체 모듈 분석
### 작성일: 2026-02-11 15:40

---

## 📌 요약: 발견된 문제 목록

| # | 심각도 | 모듈 | 문제 | 상태 |
|---|:---:|------|------|:---:|
| 1 | 🔴 | 치료사 초대 | 위례 치료사 "초대됨" 표시지만 실제 auth 계정 미생성 가능 | 분석 완료 |
| 2 | 🔴 | child_therapist | 테이블이 비어있어 치료사-아동 배정 기능 미작동 | 발견 |
| 3 | 🔴 | DB ENUM | `schedule_status`에 `carried_over` 누락 (SQL 실행 전) | 수정됨 |
| 4 | 🔴 | SQL 스크립트 | `CREATE_AIN_ADMIN.sql` varchar ↔ uuid 타입 불일치 | ✅ 수정됨 |
| 5 | 🟡 | 크레딧 시스템 | `children.credit` 칼럼은 DB에 있지만 `schema.sql`에 정의 안됨 | 주의 |
| 6 | 🟡 | 치료사 매칭 | `therapists ↔ user_profiles` 매칭이 email 기반 — profile_id 미활용 | 구조적 |
| 7 | 🟡 | database.types.ts | 구버전 — `carried_over` 등 최신 DB 변경 미반영 | 타입 재생성 필요 |
| 8 | 🟢 | 데이터 격리 | 대부분 모듈에서 `center_id` 필터링 적용 — 수납도 수정 완료 | 정상 |
| 9 | 🟢 | 정산 (Settlement) | `center_id` 필터 적용됨 | 정상 |
| 10 | 🟢 | 수납 (Billing) | 이월/크레딧/환불 구현 완료 | ✅ 수정됨 |

---

## 🔴 1. 위례 치료사 초대 문제 (핵심 분석)

### 현상
- 위례 지점에서 치료사를 초대했으나 `therapists` 테이블에 치료사가 생성되지 않은 것처럼 보임
- 스크린샷의 직원 관리 UI에는 `display+xxx@zarada.local` 이메일의 치료사들이 표시됨

### 근본 원인 분석

**두 가지 다른 치료사 생성 경로가 존재합니다:**

#### 경로 A: "직원 관리" (TherapistList.tsx) → Edge Function 초대
```
[직원 관리] → supabase.functions.invoke('invite-user') → Supabase Admin API
    → inviteUserByEmail() → auth.users 생성 + 초대 이메일 발송
    → user_profiles upsert (role, center_id)
    → therapists upsert (email, name, center_id, system_role)
```
**이 경로는 `therapists` 테이블에 레코드를 정상 생성합니다.**

#### 경로 B: "치료사 배치 마스터" (SettingsPage.tsx → TherapistProfilesManager) → 직접 INSERT
```
[설정 > 치료사 배치] → supabase.from('therapists').insert(payload)
    → email: "display+randomId@zarada.local" (가짜 이메일)
    → auth 계정 없음, 이메일 초대 없음
    → 단순히 홈페이지 표시용 프로필만 생성
```
**이 경로는 `therapists` 테이블에 레코드를 생성하지만, auth 계정은 없습니다.**

### 💡 문제의 핵심

위례 지점에서 스크린샷에 보이는 치료사들(`display+xxx@zarada.local`)은 **"설정 > 치료사 배치 마스터"에서 홈페이지 표시용으로만 생성된 프로필**입니다.

**실제 로그인 가능한 직원 계정을 만들려면** 직원 관리 탭에서 **실제 이메일로 초대**해야 합니다.

### 치료사 초대 후 로그인까지의 플로우
```
1. 관리자가 "직원 관리"에서 치료사 이메일 입력 후 초대
2. Edge Function이 Supabase inviteUserByEmail 호출
3. 치료사에게 초대 이메일 발송
4. 치료사가 이메일의 링크 클릭 → /auth/update-password 로 이동
5. 비밀번호 설정 완료 → 로그인 가능
```

**초대 이메일을 확인하지 않으면:**
- `auth.users`에 계정은 생성되지만 `confirmed_at`이 NULL
- `therapists` 테이블에는 레코드 생성됨 (Edge Function에서 upsert)
- 로그인은 불가능

### ⚠️ 확인 필요 사항
- 위례 지점 관리자가 **"직원 관리"가 아닌 "설정 > 치료사 배치"에서만 추가**한 것인지 확인
- "직원 관리"에서 초대한 경우, 치료사들의 **스팸 메일함** 확인 필요
- Supabase Dashboard > Authentication에서 해당 이메일의 auth 계정 존재 여부 직접 확인

---

## 🔴 2. child_therapist 테이블이 비어있음 (심각)

### 현상
- `child_therapist` 테이블이 DB에 존재하지만 데이터가 0건
- 이 테이블은 **아동 ↔ 치료사 배정** 관계를 관리하는 핵심 테이블

### 코드에서의 사용처
```typescript
// ChildList.tsx - 치료사 역할일 때 담당 아동만 필터링
const { data: assignments } = await supabase
    .from('child_therapist')
    .select('child_id')
    .eq('therapist_id', authTherapistId);

// ParentStatsPage.tsx - 보호자 앱에서 배정 치료사 정보 표시
const { data } = await supabase
    .from('child_therapist')
    .select('therapist_id, therapists(name, specialties)')
    .eq('child_id', childId);
```

### 영향 범위
| 기능 | 영향 | 설명 |
|------|:---:|------|
| 치료사의 아동 목록 | 🔴 | 치료사 로그인 시 아동이 0명으로 표시 |
| 보호자 앱 치료사 정보 | 🔴 | 배정된 치료사 정보 표시 불가 |
| 일정 관리 | 🟢 | `schedules.therapist_id`로 처리 (child_therapist 불필요) |
| 수납 관리 | 🟢 | `schedules` 기반으로 처리 (child_therapist 불필요) |

### 원인
**아동-치료사 배정 UI가 없습니다.** `ChildModal.tsx`에서 아동 등록 시 치료사 배정 기능이 구현되지 않았습니다.
현재 스케줄에서 간접적으로 (아동+치료사) 조합이 만들어지지만, `child_therapist` 테이블에 자동 삽입하는 로직이 없습니다.

### 해결 방안
**Option A** (권장): 일정 생성 시 child_therapist에 자동 INSERT 트리거 추가
```sql
-- 일정이 생성될 때 child_therapist에 자동 배정
CREATE OR REPLACE FUNCTION auto_assign_child_therapist()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO child_therapist (child_id, therapist_id, service_type, is_primary)
    VALUES (NEW.child_id, NEW.therapist_id, NEW.service_type, true)
    ON CONFLICT (child_id, therapist_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_assign
AFTER INSERT ON schedules
FOR EACH ROW
WHEN (NEW.child_id IS NOT NULL AND NEW.therapist_id IS NOT NULL)
EXECUTE FUNCTION auto_assign_child_therapist();
```

**Option B**: 아동 관리 모달에 치료사 배정 UI 추가

---

## 🟡 3. 치료사 ↔ user_profiles 매칭 방식 취약 (구조적 문제)

### 현재 방식
```typescript
// TherapistList.tsx line 146
const profile = profileData?.find(p => p.email === t.email);
```
- `therapists.email`과 `user_profiles.email`을 **문자열 비교**로 매칭
- `therapists.profile_id` 필드가 DB에 존재하지만 **활용되지 않음**

### 위험성
| 시나리오 | 결과 |
|---------|------|
| 이메일 대소문자 불일치 | 매칭 실패 → userId null |
| `@zarada.local` 표시용 치료사 | 매칭 불가 (정상) |
| 이메일 변경 시 | 매칭 깨짐 |
| 같은 이메일로 다른 센터 | 첫 번째 매칭 반환 (하지만 center_id 필터로 일단 안전) |

### 권장 개선
Edge Function(`invite-user`)에서 이미 `finalUserId`를 알고 있으므로, 
`therapists.profile_id = finalUserId`로 설정하면 FK 기반 안전 매칭 가능

---

## 🟡 4. schema.sql ↔ 실제 DB 불일치

### children.credit
- **DB 실제**: `children` 테이블에 `credit` 칼럼 존재 (database.types.ts 확인)
- **schema.sql**: `credit` 칼럼 정의 없음
- **코드**: `Billing.tsx`, `ScheduleModal.tsx`에서 정상 사용 중
- **상태**: 코드와 DB는 맞지만, schema.sql이 업데이트 안됨

### schedule_status ENUM
- **DB 실제**: `'scheduled' | 'completed' | 'cancelled' | 'makeup'`
- **필요**: `'carried_over'` 추가 (SQL 스크립트 생성 완료, 실행 필요)
- **database.types.ts**: 아직 미반영 (재생성 필요)

### child_therapist 테이블
- **DB 실제**: 존재하지만 데이터 0건
- **schema.sql**: 정의 없음 (아마 마이그레이션에서 추가됨)
- **database.types.ts**: 구조 정의 있음 (정상)

---

## 🟡 5. 정산(Settlement) 모듈 재점검

### center_id 필터
```typescript
// Settlement.tsx
.eq('center_id', centerId)  // ✅ 적용됨 (line 234, 245)
```
**정상**: 센터별 데이터 격리가 되어 있음

### 잠재적 문제: therapists 합류 여부
- 정산은 `therapists` 테이블의 `session_price_weekday`, `session_price_weekend` 등을 참조
- 위례 지점에서 치료사가 `@zarada.local` 이메일로만 등록된 경우:
  - `therapists` 레코드는 존재 → 정산 데이터 접근 가능
  - 하지만 `base_salary`, `session_price_*` 등이 기본값(0)일 수 있음
  - **결과**: 정산 금액이 0원으로 계산될 가능성

---

## 🟡 6. 초대 Edge Function 주의사항

### 현재 로직 (invite-user/index.ts)
```typescript
// line 119: Supabase Admin API로 초대 이메일 발송
const { data: authData, error: inviteError } = 
    await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { name, role: finalRole, full_name: name, center_id: targetCenterId },
        redirectTo: finalRedirectTo,
    });
```

### 알려진 제한사항
1. **PRIVATE_SERVICE_ROLE_KEY 필수**: Supabase Secrets에 설정 필요
2. **이미 존재하는 유저**: 422 에러 후 기존 유저 찾아서 profile sync만 수행
3. **redirectTo**: `https://app.myparents.co.kr/auth/update-password` 기본값
   - 커스텀 도메인 설정이 안 되어 있으면 리다이렉트 실패 가능
4. **이메일 발송 한도**: Supabase 무료 플랜은 시간당 이메일 4건 제한

---

## 🟢 7. 정상 작동 확인된 모듈

| 모듈 | center_id 필터 | credit 연동 | 상태 |
|------|:---:|:---:|:---:|
| 일정 관리 (Schedule) | ✅ | N/A | 정상 |
| 아동 관리 (ChildList) | ✅ | N/A | 정상 |
| 프로그램 관리 (Programs) | ✅ | N/A | 정상 |
| 상담 목록 (Consultations) | ✅ | N/A | 정상 |
| 일지 관리 (SessionList/Note) | ✅ | N/A | 정상 |
| 리드 관리 (LeadList) | ✅ | N/A | 정상 |
| 대시보드 (Dashboard) | ✅ | N/A | 정상 |
| 수납 관리 (Billing) | ✅ | ✅ | ✅ 개선 완료 |
| 정산 (Settlement) | ✅ | N/A | 정상 |
| 직원 관리 (TherapistList) | ✅ | N/A | 정상 |
| 학부모 관리 (ParentList) | ✅ | N/A | 정상 |

---

## 🛠️ 즉시 실행 필요 SQL 목록

### 1. ENUM 추가 (이미 생성됨)
```sql
ALTER TYPE schedule_status ADD VALUE IF NOT EXISTS 'carried_over';
```

### 2. 아인병원 Admin 계정 (수정됨 — varchar 에러 해결)
`database/CREATE_AIN_ADMIN.sql` 재실행

### 3. child_therapist 자동 배정 트리거 (신규 — 아래 별도 작성)

---

## 📊 우선순위별 조치 계획

### 즉시 (Today)
1. ✅ `CREATE_AIN_ADMIN.sql` varchar 에러 수정 → 재실행
2. ⬜ `ADD_CARRIED_OVER_STATUS.sql` Supabase에서 실행
3. ⬜ `database.types.ts` 재생성

### 이번 주
4. ⬜ child_therapist 자동 배정 트리거 구현 및 실행
5. ⬜ 기존 schedules 데이터로 child_therapist 역보정
6. ⬜ 위례 지점 치료사 실제 이메일로 재초대

### 다음 주
7. ⬜ `therapists.profile_id` 활용하는 매칭 로직으로 전환
8. ⬜ `schema.sql`에 `credit`, `child_therapist` 정의 추가
9. ⬜ 사용하지 않는 162개 SQL 파일 정리

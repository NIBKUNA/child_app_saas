---
description: 커스텀 도메인 환경에서 코드 변경 시 반드시 확인해야 할 체크리스트
---

# 커스텀 도메인 호환성 체크리스트

## 핵심 원칙
커스텀 도메인(`zaradacenter.co.kr` 등)에서는 `isMainDomain()`이 **false**를 반환한다.
따라서 도메인 분기 로직(`isMainDomain`, `isSaaSDomain`, `isCustomDomain`)을 사용하는 모든 코드는
**반드시 커스텀 도메인 시나리오를 동시에 테스트**해야 한다.

## 도메인 분기가 있는 핵심 파일 (변경 시 주의)

| 파일 | 역할 |
|------|------|
| `src/config/domain.ts` | `isMainDomain()`, `navigateToMainDomain()`, `centerPath()` |
| `src/contexts/CenterContext.tsx` | 커스텀 도메인 → 센터 자동 매핑 (L99~126) |
| `src/App.tsx` → `AppHomeRedirect` | `/` 경로 리다이렉트 분기 |
| `src/pages/auth/Login.tsx` | 로그인 후 리다이렉트 분기 |
| `src/layouts/MasterLayout.tsx` | "통합페이지" 버튼 → `navigateToMainDomain` |
| `src/components/Sidebar.tsx` | 홈페이지 바로가기 링크 |

## 변경 시 체크 항목

### 1. 리다이렉트/네비게이션 수정 시
- [ ] `app.myparents.co.kr` (SaaS 도메인)에서 테스트
- [ ] 커스텀 도메인(`zaradacenter.co.kr`)에서 동일 동작 확인
- [ ] **super_admin** 계정으로 양쪽 모두 테스트
- [ ] **admin** 계정으로 양쪽 모두 테스트
- [ ] **parent** 계정으로 양쪽 모두 테스트

### 2. CenterContext/센터 분리 수정 시
- [ ] 커스텀 도메인에서 센터 자동 매핑 정상 작동 확인
- [ ] super_admin이 특정 센터에 갇히지 않는지 확인
- [ ] localStorage `zarada_center_slug` 값이 올바르게 설정/해제되는지 확인

### 3. 새 페이지/라우트 추가 시
- [ ] `ProtectedRoute`의 `allowedRoles`에 적절한 역할 지정
- [ ] 데이터 쿼리에 `center_id` 필터 포함 확인
- [ ] `!centerId` 가드 추가 확인

## 절대 규칙

1. **도메인으로 권한을 판단하지 않는다** → `role` 기반으로만 판단
2. **super_admin 체크는 항상 role + email 이중 체크** → `role === 'super_admin' || isSuperAdmin(user?.email)`
3. **커스텀 도메인에서 super_admin은 해당 센터 홈페이지를 봐야 한다** → GlobalLanding은 SaaS 도메인에서만
4. **센터 데이터 쿼리는 반드시 `center_id` 필터** → 예외 없음

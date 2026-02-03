# 🏗️ Architecture Guide: Zarada Multi-Center SaaS

이 문서는 시니어가 프로젝트의 핵심 설계와 운영 로직을 한눈에 파악할 수 있도록 작성되었습니다.

---

## 1. SaaS Isolation Strategy (데이터 격리)

본 프로젝트는 단중 데이터베이스(Supabase) 내에서 여러 센터(Tenants)를 지원하는 SaaS 아키텍처를 따릅니다.

### 핵심 매커니즘
- **Tenant Identification**: URL Slug (`/centers/:slug`)를 통해 테넌트를 식별합니다.
- **Context Governance**: `src/contexts/CenterContext.tsx`에서 슬러그를 기반으로 `center_id`를 전역 관리합니다.
- **Strict Data Filtering**: 
  - 대부분의 테이블은 `center_id`를 직접 보유합니다.
  - `payments` 테이블처럼 `center_id`가 없는 경우, `children` 테이블과의 **Inner Join**(`children!inner(center_id)`)을 통해 격리를 수행합니다.
  - 핵심 파일: `src/pages/app/Billing.tsx` (데이터 격리 쿼리 예시 확인 가능)

---

## 2. Marketing Tracking Engine (마케팅 추적)

방문자의 유입 경로를 추적하여 마케팅 효율을 분석하는 엔진이 내장되어 있습니다.

### 데이터 흐름
1. **Detection**: `src/hooks/useTrafficSource.ts`에서 URL의 UTM 파라미터 및 `document.referrer`를 감지합니다.
2. **Persistence**: 
   - `sessionStorage`에 출처 정보를 임시 보관합니다.
   - `site_visits` 테이블에 방문 기록(IP 제외, User-Agent 포함)을 1회성으로 기록합니다.
3. **Conversion**: 상담 신청(`Leads/Consultations`) 시 세션에 저장된 정보를 함께 저장하여 유입 경로를 완성합니다.

---

## 3. Type System & Schema Management

100% TypeScript를 달성하여 런타임 에러를 최소화합니다.

- **Schema Truth**: `src/types/database.types.ts`는 Supabase 스키마의 단일 진실원(Source of Truth)입니다.
- **Strict Typings**: `@ts-nocheck`를 전면 제거하였으며, 모든 API 요청과 컴포넌트 Props는 인터페이스를 통해 타입이 강제됩니다.
- **Maintenance**: 스키마 변경 시 `npx supabase gen types typescript`를 통해 타입을 동기화합니다.

---

## 4. Maintenance & Diagnostic Tools

프로젝트 운영 및 장애 복구를 위한 전문 스크립트가 `scripts/maintenance/`에 준비되어 있습니다.

### 주요 카테고리 (총 45개 스크립트)
- **DB Repair**: 스키마 오류나 고아 레코드(Orphan record) 복구용 SQL (`FINAL_DB_REPAIR.sql` 등).
- **State Diagnosis**: 서비스 상태 및 데이터 정합성을 체크하는 JS 스크립트 (`diagnose_system_state.js`).
- **Security Check**: RLS 정책 및 권한 부여 상태 검증 (`verify_rls.sql`).
- **Data Injection**: 테스트용 스테이징 데이터 주입 및 초기화 (`INJECT_STAGING_DATA.sql`).

---

## 5. UI/UX & Branding Logic

- **3-Tier Branding**: `useCenterBranding.ts` 훅이 [기본값 -> LocalStorage 캐시 -> 서버 실시간 데이터] 순으로 브랜딩을 적용하여 렌더링 지연을 제거합니다.
- **Theme Support**: `ThemeProvider`를 통해 다크 모드와 브랜드 컬러 테마를 통합 관리합니다.

---
*Last Updated: 2026-02-03*
*Developed with excellence by Antigravity AI*

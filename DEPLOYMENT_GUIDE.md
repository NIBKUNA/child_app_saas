# 🚀 신규 센터 배포 가이드 (Multi-Center Deployment)

이 가이드는 현재의 완벽한 시스템을 **다른 센터(지점)용으로 그대로 복사하여 독립적으로 배포**할 때 필요한 절차를 설명합니다.

---

## 1. 전제 조건 (Prerequisites)
-   새로운 **Supabase** 프로젝트가 생성되어 있어야 합니다.
-   새로운 **Vercel** 프로젝트가 생성되어 있어야 합니다.
-   센터 전용 도메인(또는 서브도메인)이 필요합니다.

---

## 2. 🗄️ 데이터베이스 세팅 (Supabase)
새로운 Supabase SQL Editor에서 다음 순서로 스크립트를 실행합니다.

1.  **기본 스키마:** `database/schema.sql` (전체 복사 후 실행)
2.  **보안 정책:** `database/migrations/20260110_rls_advanced_policies.sql`
3.  **최신 패치:** `database/migrations/20260121_complete_cleanup_fix.sql` (가장 중요)
4.  **센터 데이터 입력:**
    ```sql
    INSERT INTO public.centers (name, phone, address) 
    VALUES ('신규 센터명', '02-000-0000', '센터 주소')
    RETURNING id; -- 여기서 나온 UUID를 VITE_CENTER_ID로 사용합니다.
    ```

---

## 3. 🌐 배포 설정 (Vercel)
새 센터의 Vercel 프로젝트 설정(`Environment Variables`)에 다음 항목을 반드시 입력합니다.

| Key | Value (예시) | 설명 |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | 새 Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJh...` | 새 Supabase Anon Key |
| `VITE_CENTER_ID` | `새로_생성된_UUID` | 위 2번 단계에서 생성된 센터 ID |
| `VITE_CENTER_NAME` | `자라다 강남점` | 사이트 상단 및 SEO에 표시될 이름 |

---

## 4. 🎨 브랜딩 및 설정 커스터마이징
앱 배포 후, **슈퍼 어드민 계정**으로 로그인하여 `관리자 설정` 메뉴에서 다음을 변경합니다.
-   **로고:** 센터 로고 이미지 업로드
-   **메인 배너:** 히어로 섹션 배경 이미지
-   **카카오톡 URL:** 상담용 카카오 채널 링크
-   **프로그램 정보:** 해당 센터에서 운영하는 치료 프로그램 리스트

---

## 5. 💡 요약: "복사"가 쉬운 이유
-   **코드 수정 불필요:** 코드 내에 특정 센터 정보가 하드코딩되어 있지 않습니다.
-   **환경 변수 기반:** 모든 설정이 `.env` (Vercel 설정) 하나로 제어됩니다.
-   **DB 격리:** 각 센터는 자신만의 Supabase DB를 가지므로 데이터가 섞일 염려가 전혀 없습니다.

---

**관리자 참고:** 
배포 중 권한(RLS) 에러가 발생하면 `database/migrations/20260121_complete_cleanup_fix.sql`을 다시 한번 실행해 주세요.

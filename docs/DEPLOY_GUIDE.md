# 🎨 Zarada ERP - 새로운 센터 배포 마스터 가이드

이 가이드는 현재의 **단일 센터용 코드베이스**를 그대로 활용하여, 완전히 새로운 Supabase 프로젝트와 Vercel 프로젝트를 통해 **독립된 새로운 센터 사이트**를 처음부터 끝까지 구축하는 방법을 설명합니다.

---

## 1. Supabase 데이터베이스 구축 (SQL 실행 순서)

새로운 Supabase 프로젝트를 생성한 후, **SQL Editor** 메뉴에서 다음 파일들의 내용을 복사하여 **순서대로** 실행하십시오. (순서가 틀리면 테이블 간 참조 오류가 발생할 수 있습니다.)

1.  **`database/schema.sql`**
    *   앱의 뼈대가 되는 모든 테이블(유저, 프로필, 스케줄 등)과 보안 정책(RLS)을 생성합니다.
2.  **`database/admin_settings.sql`**
    *   로고, 브랜드명 등 사이트 운영 설정을 위한 테이블을 생성합니다.
3.  **`database/create_admin_delete_rpc_v5.sql`**
    *   관리자 페이지에서 유저를 안전하게 삭제하기 위한 백엔드 함수(RPC)를 생성합니다.
4.  **`database/final_fix_signup_trigger.sql`**
    *   **[필수]** 회원가입 시 `profiles` 테이블에 유저 정보를 자동으로 생성해주는 엔진입니다. 실행하지 않으면 로그인이 되지 않습니다.
5.  **`init.sql` (루트 폴더)**
    *   기본 프로그램 카테고리와 초기 환경 데이터를 채워 넣습니다.
6.  **`database/reviews_schema.sql`** (필요 시)
    *   홈페이지 내 후기 기능을 사용하려면 실행하십시오.

---

## 2. Supabase 대시보드 수동 설정

SQL로 자동화되지 않는 웹 대시보드 내 필수 설정 항목입니다.

### 📁 Storage (파일 업로드 저장소) 생성
**Storage** 메뉴로 이동하여 다음 버킷들을 각각 생성하고, 반드시 **"Public"**으로 설정하십시오.
- `center-assets`: 센터 로고, 메인 배너 이미지 저장용
- `blog-images`: 블로그 게시글 내 이미지 저장용
- `attendance-logs`: 치료 출결 서명 및 사진 저장용

### 🔐 Authentication (인증) 설정
- **Providers -> Email**: `Confirm Email` 가동 스위치를 **OFF**하십시오. (사용자가 이메일 인증 절차 없이 즉시 가입/로그인 가능)

---

## 3. Vercel 프로젝트 생성 및 환경 변수 설정

1.  GitHub 저장소를 Vercel에 새 프로젝트로 가져오기 합니다.
2.  **Settings -> Environment Variables** 메뉴에서 다음 항목들을 정확히 입력합니다.

| 환경 변수명 | 설명 | 예시/방법 |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | 새 Supabase 프로젝트 URL | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | 새 Supabase Anon Key | `eyJhbGciOiJIUz...` |
| **`VITE_CENTER_ID`** | 데이터 식별용 고유 ID | `centers` 테이블에 등록한 행의 UUID |
| `VITE_SITE_TITLE` | 브라우저 탭 및 사이트 제목 | `자라다 아동발달센터 OO점` |
| `VITE_CANONICAL_URL` | 접속 도메인 주소 | `https://zarada-center-new.co.kr` |
| `VITE_NAVER_VERIFICATION` | 네이버 서치어드바이저 코드 | `b03c0f83417e4e...` |
| `VITE_CENTER_PHONE` | SEO용 대표 전화번호 | `02-416-2213` |
| `VITE_CENTER_ADDRESS` | SEO용 대표 주소 | `서울시 OO구 OO동...` |

---

## 4. 최종 관리자 권한 부여 활성화

보안을 위해 첫 가입자는 수동으로 관리자 등급으로 올려주어야 합니다.

1.  배포된 새 사이트의 `/register` 페이지에서 관리자용 이메일로 가입합니다.
2.  Supabase **SQL Editor**에서 아래 쿼리를 입력하여 권한을 수동으로 변경합니다.
    ```sql
    UPDATE profiles 
    SET role = 'admin' 
    WHERE email = '관리자이메일@example.com';
    ```

---

## 5. 확인 리스트 (Checklist)

구축이 완료되면 관리자 대시보드에서 다음 사항을 최종 확인하십시오.
- [ ] 사이트 하단 정보 및 로고가 설정값대로 표시되는가?
- [ ] 블로그 글쓰기 시 사진 업로드가 정상적으로 처리되는가?
- [ ] 스케줄 캘린더에서 치료 일정이 추가/삭제되는가?
- [ ] 네이버/구글 검색 엔진에서 사이트 제목이 환경 변수대로 잡히는가?

---
*Created by Zarada AI Agent*

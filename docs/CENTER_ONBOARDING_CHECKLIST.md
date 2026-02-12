# 🏢 새 센터 온보딩 체크리스트

> **목표**: 센터 생성 후 "풍성한" 공개 홈페이지를 완성하기 위한 추천 세팅 가이드  
> **예상 소요 시간**: 약 20~30분 (콘텐츠 준비 완료 기준)  
> **기준 버전**: 2026-02-12

---

## 📋 Phase 1: 필수 기본 정보 (5분)
> **설정 위치**: 마스터 콘솔 → 센터 상세 페이지

이 정보는 **Header, Footer, SEO, JSON-LD** 등 거의 모든 공개 페이지에서 사용됩니다.

| # | 항목 | DB 필드 (`centers` 테이블) | 영향 범위 | 예시 |
|---|---|---|---|---|
| 1 | ✅ 센터 이름 | `name` | Header 로고 옆 텍스트, SEO 타이틀, Footer | `자라다 아동발달센터 잠실점` |
| 2 | ✅ 고유 주소 (Slug) | `slug` | URL 경로 (`/centers/jamsil`) | `jamsil` |
| 3 | ✅ 주소 | `address` | Footer, SEO 지역 키워드 자동 추출, JSON-LD | `서울특별시 송파구 잠실동 123-45` |
| 4 | ✅ 전화번호 | `phone` | Footer, 연락처 페이지, JSON-LD | `02-1234-5678` |
| 5 | ✅ 이메일 | `email` | Footer | `jamsil@zarada.co.kr` |

> ⚠️ **주소**는 특히 중요합니다. `useLocalSEO` 훅이 주소에서 지역명(예: "잠실", "송파")을 자동 추출하여 모든 페이지의 SEO 타이틀과 키워드를 자동 생성합니다.

---

## 🎨 Phase 2: 브랜드 아이덴티티 (5분)
> **설정 위치**: 업무 시스템 → 사이트 관리 → `브랜드/SEO` 탭

| # | 설정 키 (`admin_settings`) | 용도 | 권장값 |
|---|---|---|---|
| 1 | `center_logo` | Header 로고 이미지 (투명 배경 PNG 권장) | 가로형 로고, 높이 56px 기준 |
| 2 | `brand_color` | 전체 액센트 컬러 (히어로, 버튼, 링크 등) | HEX 코드 (예: `#2563eb`) |
| 3 | `seo_keywords` | 추가 SEO 키워드 (쉼표 구분) | `잠실 언어치료, 송파 감각통합, 잠실 놀이치료` |

---

## 🏠 Phase 3: 홈페이지 콘텐츠 (5분)
> **설정 위치**: 사이트 관리 → `홈` 탭

| # | 설정 키 | 표시 위치 | 기본값 (미설정 시) |
|---|---|---|---|
| 1 | `main_banner_url` | 히어로 배경 이미지/영상 | 기본 그라디언트 |
| 2 | `banner_animation` | 배너 전환 애니메이션 | `fade` |
| 3 | `banner_duration` | 배너 전환 속도 (초) | `6` |
| 4 | `home_title` | 히어로 메인 타이틀 | `아이의 행복한 성장` |
| 5 | `home_title_size` | 타이틀 크기 (%) | `100` |
| 6 | `home_subtitle` | 히어로 부제목 + SEO description | `아이의 행복한 성장을 함께합니다` |
| 7 | `home_subtitle_size` | 부제목 크기 (%) | `100` |
| 8 | `notice_text` | 상단 공지 배너 | 미표시 |
| 9 | `home_story_title` | 스토리 섹션 제목 | 기본 문구 |
| 10 | `home_story_body` | 스토리 섹션 본문 | 기본 문구 |
| 11 | `home_story_image` | 스토리 섹션 이미지 | 기본 이미지 |
| 12 | `home_cta_text` | CTA 버튼 텍스트 | `상담 예약하기` |
| 13 | `home_cta_link` | CTA 버튼 링크 | `/centers/{slug}/contact` |

---

## 📖 Phase 4: 소개 페이지 (5분)
> **설정 위치**: 사이트 관리 → `소개` 탭

| # | 설정 키 | 용도 | 기본값 |
|---|---|---|---|
| 1 | `about_intro_text` | 소개 히어로 문구 | 기본 인사말 |
| 2 | `about_main_image` | 메인 소개 이미지 | 없음 |
| 3 | `about_desc_title` | 설명 섹션 타이틀 | `따뜻한 시선으로 아이의 잠재력을 발굴합니다` |
| 4 | `about_desc_body` | 설명 섹션 본문 | 기본 소개글 |
| 5 | `about_gallery` | 갤러리 이미지 (JSON 배열) | 없음 |
| 6 | `about_cta_text` | CTA 텍스트 | `상담 예약하기` |
| 7 | `about_cta_link` | CTA 링크 | 연락처 페이지 |

---

## 🧩 Phase 5: 프로그램 (3분)
> **설정 위치**: 사이트 관리 → `프로그램` 탭

| # | 설정 키 | 용도 | 기본값 |
|---|---|---|---|
| 1 | `programs_intro_text` | 프로그램 페이지 소개 문구 | `아이의 고유한 특성을 존중하며...` |
| 2 | `programs_list` | 프로그램 목록 (JSON) | 기본 6개 프로그램 표시 |

> 💡 `programs_list`를 설정하지 않으면 `DEFAULT_PROGRAMS` (언어치료, 놀이치료, 인지치료, 감각통합, 사회성 그룹, 종합평가)가 자동 표시됩니다. 센터별로 특화 프로그램이 있으면 커스터마이즈하세요.

---

## 👩‍⚕️ Phase 6: 치료사 프로필 (5분)
> **설정 위치**: 사이트 관리 → `치료사` 탭

| # | 설정 키 / 기능 | 용도 |
|---|---|---|
| 1 | `therapists_intro_text` | 치료사 소개 페이지 문구 |
| 2 | `TherapistProfilesManager` | 치료사 프로필 추가/순서/노출 관리 |
| 3 | 치료사별 `website_visible` | `true`인 치료사만 공개 페이지에 표시 |
| 4 | 치료사별 `photo_url` | 프로필 사진 |
| 5 | 치료사별 `specialty` | 전문 분야 (필터에 사용) |

> ⚠️ 치료사가 0명이면 공개 치료사 소개 페이지가 빈 화면으로 보입니다. 최소 1명 이상 `website_visible = true`로 설정하세요.

---

## ⏰ Phase 7: 운영 정보 (3분)
> **설정 위치**: 사이트 관리 → `운영정보` 탭

| # | 필드 (centers 테이블 직접 수정) | Footer에 표시 | 기본값 |
|---|---|---|---|
| 1 | `weekday_hours` | 평일 운영시간 | `10:00 - 19:00` |
| 2 | `saturday_hours` | 토요일 운영시간 | `09:00 - 16:00` |
| 3 | `holiday_text` | 휴무일 안내 | `일요일/공휴일 휴무` |
| 4 | `center_phone` | 연락처 (admin_settings) | centers.phone fallback |
| 5 | `center_email` | 이메일 (admin_settings) | centers.email fallback |
| 6 | `center_address` | 주소 (admin_settings) | centers.address fallback |

---

## 📱 Phase 8: SNS 링크 (2분)
> **설정 위치**: 사이트 관리 → `브랜드/SEO` 탭 하단

| # | 설정 키 | 아이콘 | 예시 |
|---|---|---|---|
| 1 | `kakao_url` | 카카오톡 | `https://pf.kakao.com/_xxxxx` |
| 2 | `sns_instagram` | Instagram | `https://instagram.com/zarada_jamsil` |
| 3 | `sns_facebook` | Facebook | (선택) |
| 4 | `sns_youtube` | YouTube | (선택) |
| 5 | `sns_blog` | 블로그 | `https://blog.naver.com/zarada` |

> 💡 링크가 없는 SNS 아이콘은 자동으로 숨겨집니다.

---

## ✅ 완성도 체크리스트

### 🟢 최소 완성 (5분) — "기본 노출 가능"
- [ ] 센터 이름, 슬러그, 주소, 전화번호 입력
- [ ] `brand_color` 설정
- [ ] `center_logo` 업로드

### 🟡 권장 완성 (15분) — "검색 노출 + 전환 가능"
- [ ] 위 최소 완성 항목 전체
- [ ] 홈페이지 히어로 배너 이미지 + 타이틀/부제목
- [ ] SEO 키워드 입력 (`seo_keywords`)
- [ ] 최소 3명 치료사 프로필 공개
- [ ] 카카오톡 채널 URL 연결
- [ ] 운영시간 정확히 입력

### 🟣 풀 완성 (30분) — "프리미엄 노출"
- [ ] 위 권장 완성 항목 전체
- [ ] 소개 페이지: 메인 이미지 + 갤러리 + 상세 소개글
- [ ] 프로그램 커스터마이즈 (센터 특화)
- [ ] 스토리 섹션 (home_story) 커스터마이즈
- [ ] 모든 SNS 링크 연결
- [ ] `about_gallery` 센터 내부 사진 5장 이상
- [ ] 치료사 전원 프로필 사진 + 전문 분야 입력

---

## 🔍 자동으로 생성되는 것들 (설정 불필요)

다음은 **코드가 자동으로 처리**하므로 별도 설정이 필요 없습니다:

| 항목 | 자동 생성 방식 |
|---|---|
| **SEO 타이틀** | `useLocalSEO` → 주소에서 지역명 추출 → 페이지별 최적화 타이틀 |
| **SEO Description** | `useLocalSEO` → 센터명 + 지역 + 서비스 키워드 |
| **JSON-LD 구조화 데이터** | `MedicalBusiness` 스키마 자동 생성 |
| **Canonical URL** | `/centers/{slug}/{page}` 패턴 자동 생성 |
| **Open Graph 태그** | 각 페이지별 자동 설정 |
| **다크 모드** | 사용자 시스템 설정 자동 적용 |
| **글로벌 포탈 목록** | `is_active=true` 센터 자동 노출 |
| **센터 디렉토리** | `/centers` 페이지에 자동 노출 |
| **기본 프로그램** | 6개 기본 프로그램 자동 표시 |
| **Header 네비게이션** | 센터별 slug 기반 자동 구성 |
| **Footer 정보** | centers 테이블 + admin_settings 자동 결합 |
| **로고 다크모드 반전** | Header에서 자동 `filter: invert` 처리 |

---

## 💡 Pro Tips

1. **주소를 정확하게 입력하세요** — "서울특별시 송파구 잠실동"처럼 행정구역 단위로 입력하면 SEO 자동 추출이 정확합니다.

2. **배너 이미지는 가로형 고해상도** — 권장 비율 16:9, 최소 1920×1080px. 여러 장 등록하면 자동 슬라이드.

3. **브랜드 컬러는 진한 색** — 히어로 배경에 직접 사용되므로 흰 텍스트가 잘 보이는 색을 선택하세요.

4. **카카오 채널 URL은 필수** — 학부모 상담 전환의 80% 이상이 카카오톡을 통해 발생합니다.

5. **치료사 프로필 사진** — 정방형(1:1) 비율, 밝고 친근한 분위기의 사진이 전환율이 높습니다.

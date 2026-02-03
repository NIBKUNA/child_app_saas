# Zarada ERP: Multi-Center SaaS Solution

![License](https://img.shields.io/badge/license-proprietary-red)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)
![Framework](https://img.shields.io/badge/Framework-Vite%20%2B%20React-646CFF)

**Zarada ERP**는 아동발달센터를 위한 차세대 통합 관리 솔루션입니다. 다중 센터 테넌트 격리, 정밀한 수납 시스템, 그리고 AI 기반의 발달 진단 도구를 제공합니다.

---

## 🚀 Quick Start

### 1. 환경 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음 정보를 입력합니다.
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 개발 서버 실행
```bash
npm run dev
```

---

## 🏗️ 핵심 아키텍처

프로젝트의 기술적 구조와 설계 철학은 다음 문서에서 확인하실 수 있습니다.

👉 **[Architecture Guide](./ARCHITECTURE_GUIDE.md)**

### 주요 특징
- **Tenant Isolation**: URL 슬러그 기반의 완벽한 데이터 격리.
- **100% Type-Safe**: Supabase DB 스키마와 연동된 엄격한 타입 시스템.
- **Marketing Analytics**: UTM 엔진을 통한 실시간 유입 분석.
- **Premium UI**: Framer Motion 기반의 고해상도 인터랙티브 디자인.

---

## 🛠️ 유지보수 및 복구

시스템 정합성 검사 및 DB 복구를 위한 스크립트가 준비되어 있습니다.
- 위치: `scripts/maintenance/`
- 상세 설명: `ARCHITECTURE_GUIDE.md`의 [유지보수 도구] 섹션 참조.

---

## 📂 프로젝트 구조

- `src/components`: 재사용 가능한 UI 및 비즈니스 컴포넌트
- `src/contexts`: 인증, 테마, 센터 정보 전역 상태 관리
- `src/hooks`: 비지니스 로직 및 API 연동 커스텀 훅
- `src/pages`: 도메인별 페이지 구성 (SaaS/App/Public)
- `supabase/migrations`: 데이터베이스 버전 관리 및 스키마 정의

---
*Copyright © 2026 Zarada. All rights reserved.*

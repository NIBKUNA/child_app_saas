/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-10
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 이 파일의 UI/UX 설계 및 데이터 연동 로직은 독자적인 기술과
 * 예술적 영감을 바탕으로 구축되었습니다.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ✨ [Logo Preload] 로고 이미지를 React 렌더링 전에 미리 다운로드
const cachedLogoUrl = localStorage.getItem('cached_center_logo');
if (cachedLogoUrl) {
  const preloadImg = new Image();
  preloadImg.src = cachedLogoUrl;
}

// ✨ [Developer Signature]
console.log(
  "%c 🎨 Zarada ERP System %c Designed & Developed by 안욱빈 ",
  "color: #fff; background: #c0392b; padding: 5px 10px; border-radius: 5px 0 0 5px; font-weight: bold;",
  "color: #fff; background: #2c3e50; padding: 5px 10px; border-radius: 0 5px 5px 0;",
  "\n코드와 데이터로 세상을 채색하다. Copyright (c) 2026 안욱빈. All rights reserved."
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

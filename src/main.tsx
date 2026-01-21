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
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeProvider'
import './index.css'
import App from './App.tsx'

import { CURRENT_CENTER_ID } from '@/config/center';

// ✨ [Logo Preload] 센터별 로고 구분 (Flicker 방지)
const LOGO_CACHE_KEY = `cached_center_logo_${CURRENT_CENTER_ID}`;
const cachedLogoUrl = localStorage.getItem(LOGO_CACHE_KEY);
if (cachedLogoUrl) {
  const preloadImg = new Image();
  preloadImg.src = cachedLogoUrl;
}

// ✨ [Instant Title] 센터 이름을 즉시 적용 (Flash 방지)
const TITLE_CACHE_KEY = `cached_center_name_${CURRENT_CENTER_ID}`;
const cachedName = localStorage.getItem(TITLE_CACHE_KEY);
const envName = import.meta.env.VITE_SITE_TITLE; // VITE_CENTER_NAME -> VITE_SITE_TITLE 로 통일
const defaultName = '아동발달센터';

// 즉시 타이틀 설정
document.title = cachedName || envName || defaultName;

// 비동기로 DB에서 최신 이름 가져와서 갱신
(async () => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    const { data } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'center_name')
      .maybeSingle();

    if (data?.value) {
      document.title = data.value;
      localStorage.setItem(TITLE_CACHE_KEY, data.value);
    }
  } catch (e) { }
})();

// ✨ [Developer Signature]
console.log(
  "%c 🎨 Zarada ERP System %c Designed & Developed by 안욱빈 ",
  "color: #fff; background: #c0392b; padding: 5px 10px; border-radius: 5px 0 0 5px; font-weight: bold;",
  "color: #fff; background: #2c3e50; padding: 5px 10px; border-radius: 0 5px 5px 0;",
  "\n코드와 데이터로 세상을 채색하다. Copyright (c) 2026 안욱빈. All rights reserved."
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </HelmetProvider>
  </StrictMode>,
)

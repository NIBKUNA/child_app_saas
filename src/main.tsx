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

// ✨ [Recharts Warning Suppression]
// Recharts ResponsiveContainer에서 마운트 시 발생하는 크기 관련 경고 필터링
// 이 경고는 차트 기능에 영향을 주지 않는 cosmetic 경고입니다.
// 참고: https://github.com/recharts/recharts/issues/3615
const RECHARTS_FILTER = 'should be greater than 0';

const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes(RECHARTS_FILTER)) return;
  originalConsoleError.apply(console, args);
};

const originalConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes(RECHARTS_FILTER)) return;
  originalConsoleWarn.apply(console, args);
};
// Uncomment in development if needed:
// console.log(
//   "%c 🎨 Zarada ERP System %c Designed & Developed by 안욱빈 ",
//   "color: #fff; background: #c0392b; padding: 5px 10px; border-radius: 5px 0 0 5px; font-weight: bold;",
//   "color: #fff; background: #2c3e50; padding: 5px 10px; border-radius: 0 5px 5px 0;",
//   "\n코드와 데이터로 세상을 채색하다. Copyright (c) 2026 안욱빈. All rights reserved."
// );

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

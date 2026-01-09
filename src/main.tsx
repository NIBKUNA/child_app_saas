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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


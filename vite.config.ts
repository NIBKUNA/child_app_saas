import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

/**
 * ✨ SW Auto-Version Plugin
 * 매 빌드마다 sw.js의 __BUILD_HASH__를 고유한 타임스탬프로 교체
 * → sw.js 파일이 변경됨 → 브라우저가 SW 업데이트 감지 → 유저에게 알림
 */
function swAutoVersion() {
    return {
        name: 'sw-auto-version',
        closeBundle() {
            const swPath = resolve(__dirname, 'dist/sw.js');
            try {
                let content = readFileSync(swPath, 'utf-8');
                const hash = Date.now().toString(36); // e.g. "m1a2b3c"
                content = content.replace('__BUILD_HASH__', hash);
                writeFileSync(swPath, content);
                console.log(`\n  ✅ SW version stamped: zarada-${hash}\n`);
            } catch {
                // dev 모드에서는 dist 폴더가 없으므로 무시
            }
        }
    };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [react(), swAutoVersion()],
    resolve: {
        alias: [
            { find: '@', replacement: '/src' }
        ],
    },
    build: {
        // Production optimizations
        minify: 'esbuild',
        target: 'es2020',
        rollupOptions: {
            output: {
                // Code splitting for better caching
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    supabase: ['@supabase/supabase-js'],
                    ui: ['framer-motion', 'lucide-react'],
                }
            }
        },
        // Drop console and debugger in production
        esbuild: mode === 'production' ? {
            drop: ['console', 'debugger'],
        } : {},
    },
    // Environment variable prefix (already default)
    envPrefix: 'VITE_',
}))


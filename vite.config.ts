import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [react()],
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

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

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

// ✨ [Custom Storage Adapter] remember_me 값에 따라 스토리지 전환
// - remember_me === 'true': localStorage 사용 (브라우저 재시작 후에도 유지)
// - remember_me === 'false': sessionStorage 사용 (브라우저 종료 시 파기)
const customStorageAdapter = {
    getItem: (key: string): string | null => {
        // 먼저 localStorage 확인
        const localValue = localStorage.getItem(key);
        if (localValue) return localValue;

        // 없으면 sessionStorage 확인
        return sessionStorage.getItem(key);
    },
    setItem: (key: string, value: string): void => {
        const rememberMe = localStorage.getItem('remember_me');

        if (rememberMe === 'false') {
            // 로그인 유지 해제 → sessionStorage에 저장 (브라우저 종료 시 삭제)
            sessionStorage.setItem(key, value);
            localStorage.removeItem(key); // 기존 localStorage 세션 제거
        } else {
            // 로그인 유지 체크 (기본값) → localStorage에 저장
            localStorage.setItem(key, value);
            sessionStorage.removeItem(key); // 기존 sessionStorage 세션 제거
        }
    },
    removeItem: (key: string): void => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    }
};

// ✨ [Session Persistence] 커스텀 스토리지 어댑터 적용
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,           // 항상 true (스토리지 선택은 어댑터가 담당)
        autoRefreshToken: true,         // 토큰 자동 갱신
        detectSessionInUrl: true,       // OAuth 리다이렉트 세션 감지
        storageKey: 'zarada-auth-token', // 명시적 스토리지 키
        storage: customStorageAdapter    // 커스텀 스토리지 어댑터 사용
    }
});

// ✨ [Helper] 로그인 유지 설정 함수
export const setRememberMe = (value: boolean): void => {
    localStorage.setItem('remember_me', value ? 'true' : 'false');
};

// ✨ [Helper] 로그인 유지 설정 확인 함수
export const getRememberMe = (): boolean => {
    return localStorage.getItem('remember_me') !== 'false';
};

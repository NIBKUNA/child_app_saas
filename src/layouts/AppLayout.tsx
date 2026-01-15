// @ts-nocheck
/* eslint-disable */
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
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeProvider';
import { Lock, LogOut, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function AppLayout() {
    const { profile, loading } = useAuth();
    const { theme } = useTheme();

    // 로딩 중일 때는 아무것도 보여주지 않거나 로딩 스피너를 보여줍니다.
    if (loading) return null;

    // ✨ 퇴사자(retired) 권한일 경우 차단 화면을 렌더링
    if (profile?.role === 'retired') {
        return (
            <div className="fixed inset-0 z-[9999] bg-slate-50 flex items-center justify-center p-6 font-sans">
                <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200 max-w-md w-full text-center space-y-6 border border-slate-100 animate-in fade-in zoom-in duration-300 gpu-accelerate">
                    <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
                        <ShieldAlert className="w-12 h-12" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">접속 권한이 제한되었습니다</h1>
                        <p className="text-slate-500 font-bold leading-relaxed">
                            죄송합니다. 현재 계정은 <span className="text-rose-500">퇴사(Retired)</span> 처리가 완료되어 더 이상 업무 시스템에 접근하실 수 없습니다.
                        </p>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-3xl text-[13px] text-slate-400 font-bold leading-6">
                        기존 데이터(일지, 상담 기록)는 보존되어 있습니다.<br />
                        관련 문의는 센터 관리자에게 연락 바랍니다.
                    </div>

                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            window.location.href = '/';
                        }}
                        className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200 gpu-accelerate"
                    >
                        <LogOut className="w-5 h-5" /> 로그아웃 후 메인으로
                    </button>
                </div>
            </div>
        );
    }

    // Theme-aware background
    const mainBg = theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50';

    // ✨ [Real-time Notification] 상담 신청 알림
    const [notif, setNotif] = React.useState<{ title: string, msg: string, visible: boolean } | null>(null);

    React.useEffect(() => {
        // ✨ [Notification API] Request Permission on mount
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => console.log('SW Registered:', registration.scope))
                .catch(err => console.log('SW Registration Failed:', err));
        }

        const channel = supabase
            .channel('global_consultation_alerts')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'consultations' },
                (payload) => {
                    const eventType = payload.eventType;
                    // DELETE 이벤트일 경우 payload.new가 없을 수 있으므로 old를 참조하거나 기본값 처리 필요
                    const newItem = payload.new as any || {};

                    let title = '';
                    let body = '';

                    if (eventType === 'INSERT') {
                        title = '🚀 새로운 상담 신청!';
                        body = `${newItem.child_name || '아동'} (${newItem.guardian_name}) 님이 상담을 요청했습니다.`;
                    } else if (eventType === 'UPDATE') {
                        title = '🔄 상담 신청 수정';
                        body = `${newItem.child_name || '아동'} 님의 상담 신청 내역이 변경되었습니다.`;
                    } else if (eventType === 'DELETE') {
                        title = '🗑️ 상담 신청 취소/삭제';
                        body = '상담 신청 내역이 삭제되었습니다.';
                    }

                    if (!title) return;

                    // 1. In-App Toast
                    setNotif({
                        title: title,
                        msg: body,
                        visible: true
                    });

                    // 2. Browser Notification (System Level)
                    if ('Notification' in window && Notification.permission === 'granted') {
                        if (navigator.serviceWorker.controller) {
                            navigator.serviceWorker.controller.postMessage({
                                type: 'SHOW_NOTIFICATION',
                                title,
                                body
                            });
                        } else {
                            new Notification(title, {
                                body: body,
                                icon: '/pwa-192x192.png',
                                tag: 'consultation-alert'
                            });
                        }
                    }

                    // 5초 후 자동 숨김
                    setTimeout(() => setNotif(prev => prev ? { ...prev, visible: false } : null), 6000);
                }
            )
            .subscribe();

        // ✨ [Real-time Notification] 일정/세션 변경 알림
        const scheduleChannel = supabase
            .channel('global_schedule_alerts')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'schedules' },
                (payload) => {
                    const eventType = payload.eventType;
                    const title = `📅 일정 ${eventType === 'INSERT' ? '등록' : eventType === 'UPDATE' ? '수정' : '취소'}`;
                    const body = '치료 일정이 변경되었습니다. 확인해주세요.';

                    setNotif({ title, msg: body, visible: true });
                    setTimeout(() => setNotif(prev => prev ? { ...prev, visible: false } : null), 6000);
                }
            )
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'sessions' },
                (payload) => {
                    const eventType = payload.eventType;
                    const title = `📝 세션 ${eventType === 'INSERT' ? '기록' : eventType === 'UPDATE' ? '수정' : '삭제'}`;
                    const body = '치료 세션 정보가 변경되었습니다.';

                    setNotif({ title, msg: body, visible: true });
                    setTimeout(() => setNotif(prev => prev ? { ...prev, visible: false } : null), 6000);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(scheduleChannel);
        };
    }, []);

    // 정상 권한(관리자, 치료사, 일반직원)일 경우의 기본 레이아웃
    return (
        <div className={`flex h-screen ${mainBg} font-sans gpu-layer relative`}>
            {/* 🔔 Notification Popup */}
            {notif && notif.visible && (
                <div className="fixed top-6 right-6 z-[9999] animate-in slide-in-from-top-4 fade-in duration-500 cursor-pointer" onClick={() => window.location.href = '/app/consultations'}>
                    <div className="bg-slate-900/90 dark:bg-slate-800/90 text-white backdrop-blur-md p-5 rounded-[28px] shadow-2xl flex items-center gap-4 border border-slate-700/50 hover:scale-105 transition-transform gpu-accelerate">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">
                            🔔
                        </div>
                        <div>
                            <h4 className="font-black text-base text-yellow-300 mb-0.5">{notif.title}</h4>
                            <p className="text-sm font-bold text-slate-200">{notif.msg}</p>
                        </div>
                        <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping ml-2" />
                    </div>
                </div>
            )}

            {/* 사이드바 영역 */}
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden ml-0 md:ml-64">
                <main className={`flex-1 overflow-x-hidden overflow-y-auto ${mainBg} p-4 md:p-6 pb-[env(safe-area-inset-bottom,24px)]`}>
                    {/* 개별 페이지 렌더링 (Framer Motion Transition) */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="w-full h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
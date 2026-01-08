// @ts-nocheck
/* eslint-disable */
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, LogOut, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function AppLayout() {
    const { profile, loading } = useAuth();

    // 로딩 중일 때는 아무것도 보여주지 않거나 로딩 스피너를 보여줍니다.
    if (loading) return null;

    // ✨ 퇴사자(retired) 권한일 경우 차단 화면을 렌더링
    if (profile?.role === 'retired') {
        return (
            <div className="fixed inset-0 z-[9999] bg-slate-50 flex items-center justify-center p-6 font-sans">
                <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200 max-w-md w-full text-center space-y-6 border border-slate-100 animate-in fade-in zoom-in duration-300">
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
                        className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                        <LogOut className="w-5 h-5" /> 로그아웃 후 메인으로
                    </button>
                </div>
            </div>
        );
    }

    // 정상 권한(관리자, 치료사, 일반직원)일 경우의 기본 레이아웃
    return (
        <div className="flex h-screen bg-slate-50 font-sans">
            {/* 사이드바 영역 */}
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 md:p-6">
                    {/* 개별 페이지 렌더링 */}
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
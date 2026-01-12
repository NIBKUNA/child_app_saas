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
import { useState } from 'react';
import { X, Gift, ArrowRight, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeProvider';

interface InvitationCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (childName: string) => void;
    parentId: string;
}

export function InvitationCodeModal({ isOpen, onClose, onSuccess, parentId }: InvitationCodeModalProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return setError('초대 코드를 입력해 주세요.');
        if (code.length !== 5) return setError('초대 코드는 5자리 영문/숫자입니다. (형식 오류)');

        setLoading(true);
        setError(null);

        try {
            // ✨ [Secure Code Connection] RPC 함수 사용 (RLS 우회 및 트랜잭션 보장)
            const { data: result, error: rpcError } = await supabase.rpc('connect_child_with_code', {
                p_parent_id: parentId,
                p_code: code.toUpperCase().trim()
            });

            if (rpcError) throw rpcError;

            // RPC가 커스텀 에러 메시지를 반환했는지 확인
            if (!result.success) {
                throw new Error(result.message || '연결에 실패했습니다.');
            }

            // 성공 시 아동 이름 반환
            onSuccess(result.child_name);
        } catch (err: any) {
            setError(err.message || '연결에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={cn(
                "w-full max-w-md rounded-[40px] shadow-2xl border relative overflow-hidden",
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
            )}>
                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    className={cn(
                        "absolute top-6 right-6 p-2 rounded-full transition-colors z-10",
                        isDark ? "hover:bg-slate-800 text-slate-500" : "hover:bg-slate-100 text-slate-400"
                    )}
                >
                    <X className="w-5 h-5" />
                </button>

                {/* 헤더 */}
                <div className="p-8 pb-0 text-center">
                    <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4",
                        "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200"
                    )}>
                        <Gift className="w-8 h-8" />
                    </div>
                    <h2 className={cn(
                        "text-2xl font-black tracking-tight",
                        isDark ? "text-white" : "text-slate-900"
                    )}>
                        자녀 연결하기
                    </h2>
                    <p className={cn(
                        "mt-2 text-sm font-medium text-balance",
                        isDark ? "text-slate-400" : "text-slate-500"
                    )}>
                        센터에서 받은 초대 코드를 입력해 주세요
                    </p>
                </div>

                {/* 폼 */}
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div className="space-y-2">
                        <label className={cn(
                            "text-xs font-black ml-1",
                            isDark ? "text-slate-500" : "text-slate-400"
                        )}>
                            초대 코드 (5자리)
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 5))}
                            placeholder="예: AB12C"
                            maxLength={5}
                            className={cn(
                                "w-full text-center text-2xl tracking-[0.5em] font-black py-4 px-4 rounded-2xl border outline-none transition-all",
                                isDark
                                    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-600 focus:ring-4 focus:ring-indigo-500/20"
                                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-300 focus:ring-4 focus:ring-indigo-500/10"
                            )}
                        />
                    </div>

                    {error && (
                        <div className={cn(
                            "flex items-center gap-2 p-4 rounded-2xl text-xs font-bold border",
                            isDark ? "bg-red-900/20 text-red-400 border-red-800" : "bg-red-50 text-red-500 border-red-100"
                        )}>
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || code.length < 5}
                        className={cn(
                            "w-full flex items-center justify-center gap-2 py-4 font-black rounded-2xl transition-all",
                            "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700",
                            "shadow-lg shadow-indigo-200 hover:shadow-xl",
                            (loading || code.length < 5) && "opacity-60 cursor-not-allowed"
                        )}
                    >
                        {loading ? '연결 중...' : (
                            <>자녀 연결하기 <ArrowRight className="w-5 h-5" /></>
                        )}
                    </button>

                    <p className={cn(
                        "text-center text-[11px] font-medium",
                        isDark ? "text-slate-500" : "text-slate-400"
                    )}>
                        초대 코드는 센터 행정실에서 발급받으실 수 있습니다.
                    </p>
                </form>
            </div>
        </div>
    );
}

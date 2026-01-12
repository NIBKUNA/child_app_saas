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

// @ts-nocheck
/* eslint-disable */
import { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeProvider';
import { useNavigate } from 'react-router-dom';

interface AccountDeletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userEmail: string;
}

export function AccountDeletionModal({ isOpen, onClose, userId, userEmail }: AccountDeletionModalProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigate = useNavigate();

    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        if (confirmText !== '회원탈퇴') {
            setError("'회원탈퇴'를 정확히 입력해 주세요.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. 관련 데이터 정리 (개인정보 보호 정책)

            // family_relationships 삭제
            await supabase
                .from('family_relationships')
                .delete()
                .eq('parent_id', userId);

            // ✨ [안전 조치] 자녀 테이블의 parent_id 연결 해제 (데이터 보존)
            // 사용자 프로필 삭제 전, 연결된 자녀의 부모 ID를 NULL로 설정하여
            // 자녀 데이터가 CASCADE로 인해 삭제되는 것을 방지합니다.
            await supabase
                .from('children')
                .update({ parent_id: null })
                .eq('parent_id', userId);

            // user_profiles 삭제 (cascade로 연관 데이터 정리)
            await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            // therapists 테이블에서 삭제 (치료사인 경우)
            await supabase
                .from('therapists')
                .delete()
                .eq('id', userId);

            // 2. Supabase Auth 계정 삭제
            // 참고: 실제 Auth 계정 삭제는 서버 측에서 admin 권한으로 해야 함
            // 클라이언트에서는 로그아웃 후 안내
            await supabase.auth.signOut();

            alert('회원 탈퇴가 완료되었습니다.\n그동안 이용해 주셔서 감사합니다.');
            navigate('/');

        } catch (err: any) {
            setError(err.message || '탈퇴 처리 중 오류가 발생했습니다.');
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
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-red-100 text-red-600">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h2 className={cn(
                        "text-2xl font-black tracking-tight",
                        isDark ? "text-white" : "text-slate-900"
                    )}>
                        회원 탈퇴
                    </h2>
                    <p className={cn(
                        "mt-2 text-sm font-medium text-balance",
                        isDark ? "text-slate-400" : "text-slate-500"
                    )}>
                        정말 탈퇴하시겠습니까?
                    </p>
                </div>

                {/* 경고 메시지 */}
                <div className="px-8 pt-6">
                    <div className={cn(
                        "p-4 rounded-2xl border text-xs font-bold",
                        isDark ? "bg-red-900/20 text-red-400 border-red-800" : "bg-red-50 text-red-600 border-red-200"
                    )}>
                        <p className="font-black mb-2">⚠️ 주의사항</p>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>탈퇴 시 모든 개인정보가 삭제됩니다.</li>
                            <li>연결된 자녀 정보와의 연결이 해제됩니다.</li>
                            <li>이 작업은 되돌릴 수 없습니다.</li>
                        </ul>
                    </div>
                </div>

                {/* 폼 */}
                <div className="p-8 space-y-5">
                    <div className="space-y-2">
                        <label className={cn(
                            "text-xs font-black ml-1",
                            isDark ? "text-slate-500" : "text-slate-400"
                        )}>
                            확인을 위해 '회원탈퇴'를 입력해 주세요
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="회원탈퇴"
                            className={cn(
                                "w-full text-center py-4 px-4 rounded-2xl border outline-none transition-all font-bold",
                                isDark
                                    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-600 focus:ring-4 focus:ring-red-500/20"
                                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-300 focus:ring-4 focus:ring-red-500/10"
                            )}
                        />
                    </div>

                    {error && (
                        <div className={cn(
                            "p-4 rounded-2xl text-xs font-bold border",
                            isDark ? "bg-red-900/20 text-red-400 border-red-800" : "bg-red-50 text-red-500 border-red-100"
                        )}>
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className={cn(
                                "flex-1 py-4 font-black rounded-2xl transition-all border",
                                isDark
                                    ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                            )}
                        >
                            취소
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={loading || confirmText !== '회원탈퇴'}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-4 font-black rounded-2xl transition-all",
                                "bg-red-600 text-white hover:bg-red-700",
                                (loading || confirmText !== '회원탈퇴') && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {loading ? '처리 중...' : (
                                <><Trash2 className="w-4 h-4" /> 탈퇴하기</>
                            )}
                        </button>
                    </div>

                    <p className={cn(
                        "text-center text-[10px] font-medium",
                        isDark ? "text-slate-600" : "text-slate-400"
                    )}>
                        탈퇴 후 30일 이내 재가입 시 일부 데이터 복구가 가능할 수 있습니다.
                    </p>
                </div>
            </div>
        </div>
    );
}

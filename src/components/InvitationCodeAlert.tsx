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
import { X, Copy, Check, Gift, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeProvider';

interface InvitationCodeAlertProps {
    isOpen: boolean;
    onClose: () => void;
    childName: string;
    invitationCode: string;
}

export function InvitationCodeAlert({ isOpen, onClose, childName, invitationCode }: InvitationCodeAlertProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(invitationCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch (error) {
            console.error('복사 실패:', error);
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

                {/* 성공 아이콘 */}
                <div className="pt-10 text-center">
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-200 animate-in zoom-in duration-300">
                        <PartyPopper className="w-10 h-10" />
                    </div>
                    <h2 className={cn(
                        "text-2xl font-black tracking-tight",
                        isDark ? "text-white" : "text-slate-900"
                    )}>
                        아동 등록 성공! 🎉
                    </h2>
                    <p className={cn(
                        "mt-2 text-sm font-bold",
                        isDark ? "text-slate-400" : "text-slate-500"
                    )}>
                        <span className="text-emerald-600">{childName}</span> 어린이가 등록되었습니다
                    </p>
                </div>

                {/* 초대 코드 영역 */}
                <div className="p-8 space-y-6">
                    <div className={cn(
                        "p-6 rounded-3xl border-2 border-dashed text-center",
                        isDark ? "bg-indigo-900/20 border-indigo-700" : "bg-indigo-50 border-indigo-200"
                    )}>
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <Gift className={cn("w-5 h-5", isDark ? "text-indigo-400" : "text-indigo-600")} />
                            <p className={cn("text-xs font-black uppercase tracking-widest", isDark ? "text-indigo-400" : "text-indigo-600")}>
                                학부모 앱 연결 초대 코드
                            </p>
                        </div>

                        <div className={cn(
                            "text-4xl font-black tracking-[0.3em] py-3",
                            isDark ? "text-white" : "text-slate-900"
                        )}>
                            {invitationCode}
                        </div>

                        <button
                            onClick={handleCopy}
                            className={cn(
                                "mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-black text-sm transition-all",
                                copied
                                    ? "bg-emerald-500 text-white"
                                    : isDark
                                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                            )}
                        >
                            {copied ? (
                                <><Check className="w-4 h-4" /> 복사 완료!</>
                            ) : (
                                <><Copy className="w-4 h-4" /> 코드 복사</>
                            )}
                        </button>
                    </div>

                    <p className={cn(
                        "text-center text-xs font-medium leading-relaxed",
                        isDark ? "text-slate-500" : "text-slate-400"
                    )}>
                        이 코드를 학부모님께 전달해 주세요.<br />
                        학부모 앱에서 코드 입력 시 자녀와 자동 연결됩니다.<br />
                        <span className="font-bold">* 아동 관리 목록에서도 코드를 확인할 수 있습니다.</span>
                    </p>

                    <button
                        onClick={onClose}
                        className={cn(
                            "w-full py-4 rounded-2xl font-black transition-all",
                            isDark
                                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        )}
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
}

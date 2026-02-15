/**
 * 🔔 알림 설정 페이지
 * - 센터별 푸시 알림 발송 시간 설정
 * - 기능 설명 및 현황 표시
 */
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useCenter } from '@/contexts/CenterContext';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { Bell, Clock, Smartphone, CheckCircle2, Info } from 'lucide-react';

export default function NotificationSettingsPage() {
    const { getSetting, updateSetting } = useAdminSettings();
    const { center } = useCenter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [saving, setSaving] = useState(false);

    const currentHour = getSetting('reminder_hour') || '20';

    const handleTimeChange = async (hour: string) => {
        setSaving(true);
        await updateSetting('reminder_hour', hour);
        setSaving(false);
    };

    const features = [
        {
            icon: <Bell className="w-5 h-5" />,
            title: '수업 리마인더',
            desc: '내일 예정된 수업이 있는 부모님에게 자동으로 알림을 보냅니다.',
            status: '활성',
        },
        {
            icon: <Smartphone className="w-5 h-5" />,
            title: 'PWA 푸시 알림',
            desc: '앱을 설치한 부모님의 디바이스(Android, iOS, PC)로 직접 전달됩니다.',
            status: '활성',
        },
    ];

    return (
        <div className={cn("max-w-3xl mx-auto py-6 px-4 space-y-8")}>
            <Helmet><title>알림 설정 | {center?.name || 'Zarada'}</title></Helmet>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-black flex items-center gap-3">
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-2xl">
                        <Bell className="w-6 h-6" />
                    </div>
                    부모님 알림 설정
                </h1>
                <p className={cn("mt-2 text-sm font-medium", isDark ? "text-slate-400" : "text-slate-500")}>
                    부모님에게 보내는 푸시 알림의 발송 시간과 기능을 관리합니다.
                </p>
            </div>

            {/* 발송 시간 설정 */}
            <section className={cn(
                "p-8 rounded-[32px] border space-y-6",
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
            )}>
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl", isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600")}>
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black">리마인더 발송 시간</h2>
                        <p className={cn("text-xs font-medium", isDark ? "text-slate-500" : "text-slate-400")}>
                            매일 이 시간에 내일 수업이 있는 부모님에게 알림을 보냅니다.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <select
                        value={currentHour}
                        onChange={(e) => handleTimeChange(e.target.value)}
                        disabled={saving}
                        className={cn(
                            "px-5 py-3 rounded-2xl border text-base font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                            isDark
                                ? "bg-slate-800 border-slate-700 text-white"
                                : "bg-slate-50 border-slate-200 text-slate-900",
                            saving && "opacity-50"
                        )}
                    >
                        {Array.from({ length: 14 }, (_, i) => i + 9).map((h) => (
                            <option key={h} value={h}>
                                {h < 12 ? `오전 ${h}시` : h === 12 ? '오후 12시' : `오후 ${h - 12}시`}
                            </option>
                        ))}
                    </select>
                    <span className={cn("text-sm font-bold", isDark ? "text-slate-400" : "text-slate-500")}>
                        에 자동 발송
                    </span>
                    {saving && (
                        <span className="text-xs text-indigo-500 font-bold animate-pulse">저장 중...</span>
                    )}
                </div>

                <div className={cn(
                    "flex items-start gap-3 p-4 rounded-2xl",
                    isDark ? "bg-slate-800/50" : "bg-amber-50/70"
                )}>
                    <Info className={cn("w-4 h-4 mt-0.5 shrink-0", isDark ? "text-amber-400" : "text-amber-600")} />
                    <p className={cn("text-xs font-medium leading-relaxed", isDark ? "text-slate-400" : "text-amber-700")}>
                        부모님이 마이페이지에서 "수업 알림 받기"를 켜야 알림이 전달됩니다.
                        알림을 켜지 않은 부모님에게는 발송되지 않습니다.
                    </p>
                </div>
            </section>

            {/* 기능 목록 */}
            <section className="space-y-4">
                <h2 className="text-lg font-black px-1">알림 기능 현황</h2>
                <div className="grid gap-4">
                    {features.map((f, i) => (
                        <div key={i} className={cn(
                            "p-6 rounded-[28px] border flex items-start gap-4",
                            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                        )}>
                            <div className={cn(
                                "p-2.5 rounded-xl shrink-0",
                                isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600"
                            )}>
                                {f.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-black text-sm">{f.title}</h3>
                                    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">
                                        <CheckCircle2 className="w-3 h-3" />
                                        {f.status}
                                    </span>
                                </div>
                                <p className={cn("text-xs mt-1 font-medium", isDark ? "text-slate-500" : "text-slate-400")}>
                                    {f.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 안내 */}
            <section className={cn(
                "p-6 rounded-[28px] border space-y-3",
                isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-100"
            )}>
                <h3 className="font-black text-sm">📋 알림 동작 방식</h3>
                <ul className={cn("space-y-2 text-xs font-medium leading-relaxed", isDark ? "text-slate-400" : "text-slate-500")}>
                    <li>• 매 시간 시스템이 자동으로 확인하여, 설정된 시간에 맞는 센터의 알림만 발송합니다.</li>
                    <li>• 내일 <strong className={isDark ? "text-white" : "text-slate-700"}>예정(scheduled)</strong> 상태인 수업만 대상입니다.</li>
                    <li>• 부모님이 마이페이지에서 <strong className={isDark ? "text-white" : "text-slate-700"}>"수업 알림 받기"</strong>를 켜야 수신됩니다.</li>
                    <li>• Android, iOS(홈 화면 추가 시), 데스크톱 브라우저에서 수신 가능합니다.</li>
                    <li>• 각 센터별로 독립적으로 동작하며, 다른 센터의 알림은 전달되지 않습니다.</li>
                </ul>
            </section>
        </div>
    );
}

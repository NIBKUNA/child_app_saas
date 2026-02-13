import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// Zarada SaaS — Animated Infographic Promo (Code-based)
// 자동 재생 인포그래픽 "영상" (15~20초, CSS/JS 애니메이션)
// ============================================================

const TOTAL_DURATION = 18000; // 18 seconds total
const SCENES = [
    { id: 'intro', start: 0, end: 3000 },
    { id: 'kpi', start: 3000, end: 6500 },
    { id: 'dashboard', start: 6500, end: 9500 },
    { id: 'schedule', start: 9500, end: 12000 },
    { id: 'multicenter', start: 12000, end: 15000 },
    { id: 'cta', start: 15000, end: 18000 },
];

function CountUp({ target, duration = 1500, prefix = '', suffix = '' }: { target: number; duration?: number; prefix?: string; suffix?: string }) {
    const [value, setValue] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setStarted(true); },
            { threshold: 0.5 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!started) return;
        const startTime = Date.now();
        const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [started, target, duration]);

    return <span ref={ref}>{prefix}{value.toLocaleString()}{suffix}</span>;
}

export function PromoAnimation() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);

    const currentScene = SCENES.find(s => elapsed >= s.start && elapsed < s.end) || SCENES[SCENES.length - 1];
    const progress = (elapsed / TOTAL_DURATION) * 100;

    useEffect(() => {
        if (!isPlaying) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            return;
        }

        startTimeRef.current = Date.now() - elapsed;

        const tick = () => {
            const now = Date.now();
            const newElapsed = now - startTimeRef.current;

            if (newElapsed >= TOTAL_DURATION) {
                setElapsed(TOTAL_DURATION);
                setIsPlaying(false);
                return;
            }

            setElapsed(newElapsed);
            animationRef.current = requestAnimationFrame(tick);
        };

        animationRef.current = requestAnimationFrame(tick);
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
    }, [isPlaying]);

    const reset = () => {
        setIsPlaying(false);
        setElapsed(0);
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const sceneProgress = (sceneId: string) => {
        const scene = SCENES.find(s => s.id === sceneId);
        if (!scene) return 0;
        if (elapsed < scene.start) return 0;
        if (elapsed >= scene.end) return 1;
        return (elapsed - scene.start) / (scene.end - scene.start);
    };

    const isVisible = (sceneId: string) => {
        return currentScene.id === sceneId;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                        홍보 콘텐츠
                    </h1>
                    <p className="text-slate-500 font-bold mt-1 text-sm">인포그래픽 애니메이션 · 18초</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={reset} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <button onClick={toggleFullscreen} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Player */}
            <div
                ref={containerRef}
                className={cn(
                    "relative bg-[#0a0818] rounded-3xl overflow-hidden shadow-2xl border border-white/5",
                    isFullscreen ? "rounded-none" : ""
                )}
                style={{ aspectRatio: '16/9' }}
            >
                {/* ===== SCENE: INTRO ===== */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    style={{
                        opacity: isVisible('intro') ? 1 : 0,
                        visibility: isVisible('intro') ? 'visible' : 'hidden',
                        transform: `scale(${isVisible('intro') ? 1 : 0.9})`,
                        transition: 'opacity 0.4s ease, transform 0.4s ease, visibility 0.4s',
                        zIndex: isVisible('intro') ? 10 : 1,
                        pointerEvents: isVisible('intro') ? 'auto' : 'none',
                    }}
                >
                    {/* Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[100px]" />

                    {/* Badge */}
                    <div
                        className="relative flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-[3px] uppercase mb-8"
                        style={{
                            opacity: sceneProgress('intro') > 0.1 ? 1 : 0,
                            transform: `translateY(${sceneProgress('intro') > 0.1 ? 0 : 20}px)`,
                            transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
                        }}
                    >
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        NEXT-GEN ERP
                    </div>

                    {/* Title */}
                    <h2
                        className="relative text-4xl md:text-6xl lg:text-7xl font-black text-center text-white tracking-tighter leading-[1.1]"
                        style={{
                            opacity: sceneProgress('intro') > 0.2 ? 1 : 0,
                            transform: `translateY(${sceneProgress('intro') > 0.2 ? 0 : 40}px)`,
                            transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s',
                        }}
                    >
                        아동발달센터의
                        <br />
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            확실한 파트너.
                        </span>
                    </h2>

                    {/* Subtitle */}
                    <p
                        className="relative text-base md:text-lg text-white/50 text-center mt-6 max-w-md"
                        style={{
                            opacity: sceneProgress('intro') > 0.4 ? 1 : 0,
                            transform: `translateY(${sceneProgress('intro') > 0.4 ? 0 : 20}px)`,
                            transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s',
                        }}
                    >
                        센터 운영의 모든 것을 하나로
                    </p>
                </div>

                {/* ===== SCENE: KPI CARDS ===== */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center px-8 md:px-16"
                    style={{
                        opacity: isVisible('kpi') ? 1 : 0,
                        visibility: isVisible('kpi') ? 'visible' : 'hidden',
                        transition: 'opacity 0.4s ease, visibility 0.4s',
                        zIndex: isVisible('kpi') ? 10 : 1,
                        pointerEvents: isVisible('kpi') ? 'auto' : 'none',
                    }}
                >
                    <p
                        className="text-indigo-400 text-xs font-bold tracking-[3px] uppercase mb-3"
                        style={{
                            opacity: sceneProgress('kpi') > 0.05 ? 1 : 0,
                            transition: 'opacity 0.5s',
                        }}
                    >
                        REAL-TIME METRICS
                    </p>
                    <h3
                        className="text-2xl md:text-4xl font-black text-white tracking-tight text-center mb-10"
                        style={{
                            opacity: sceneProgress('kpi') > 0.1 ? 1 : 0,
                            transform: `translateY(${sceneProgress('kpi') > 0.1 ? 0 : 20}px)`,
                            transition: 'all 0.6s ease',
                        }}
                    >
                        핵심 지표를 한눈에
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 w-full max-w-3xl">
                        {[
                            { icon: '👶', value: 1247, label: '등록 아동', change: '+23', color: 'from-violet-500/20 to-violet-600/5', delay: 0 },
                            { icon: '🧠', value: 8432, label: '월 치료 세션', change: '+12.5%', color: 'from-blue-500/20 to-blue-600/5', delay: 0.1 },
                            { icon: '💰', value: 92, label: '정산 (백만원)', change: '실시간', color: 'from-emerald-500/20 to-emerald-600/5', prefix: '₩', suffix: 'M', delay: 0.2 },
                            { icon: '📅', value: 324, label: '주간 예약', change: '이번 주', color: 'from-amber-500/20 to-amber-600/5', delay: 0.3 },
                        ].map((kpi, i) => (
                            <div
                                key={i}
                                className={cn("bg-gradient-to-br border border-white/5 rounded-2xl p-4 md:p-6", kpi.color)}
                                style={{
                                    opacity: sceneProgress('kpi') > 0.15 + kpi.delay ? 1 : 0,
                                    transform: `translateY(${sceneProgress('kpi') > 0.15 + kpi.delay ? 0 : 30}px) scale(${sceneProgress('kpi') > 0.15 + kpi.delay ? 1 : 0.9})`,
                                    transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${kpi.delay}s`,
                                }}
                            >
                                <div className="text-2xl mb-2">{kpi.icon}</div>
                                <div className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                    {isVisible('kpi') ? (
                                        <CountUp target={kpi.value} prefix={kpi.prefix || ''} suffix={kpi.suffix || ''} />
                                    ) : 0}
                                </div>
                                <div className="text-xs text-white/40 font-medium mt-1">{kpi.label}</div>
                                <div className="text-[10px] text-emerald-400 font-bold mt-2 bg-emerald-400/10 inline-block px-2 py-0.5 rounded-full">
                                    {kpi.change}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ===== SCENE: DASHBOARD ===== */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center px-6 md:px-12"
                    style={{
                        opacity: isVisible('dashboard') ? 1 : 0,
                        visibility: isVisible('dashboard') ? 'visible' : 'hidden',
                        transition: 'opacity 0.4s ease, visibility 0.4s',
                        zIndex: isVisible('dashboard') ? 10 : 1,
                        pointerEvents: isVisible('dashboard') ? 'auto' : 'none',
                    }}
                >
                    <p className="text-indigo-400 text-xs font-bold tracking-[3px] uppercase mb-3"
                        style={{ opacity: sceneProgress('dashboard') > 0.05 ? 1 : 0, transition: 'opacity 0.5s' }}>
                        INTEGRATED DASHBOARD
                    </p>
                    <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight text-center mb-10"
                        style={{
                            opacity: sceneProgress('dashboard') > 0.1 ? 1 : 0,
                            transform: `translateY(${sceneProgress('dashboard') > 0.1 ? 0 : 20}px)`,
                            transition: 'all 0.6s ease',
                        }}>
                        데이터 기반 운영 관리
                    </h3>

                    {/* Mock Dashboard */}
                    <div
                        className="w-full max-w-2xl bg-white/[0.03] border border-white/10 rounded-2xl p-5 md:p-8"
                        style={{
                            opacity: sceneProgress('dashboard') > 0.2 ? 1 : 0,
                            transform: `translateY(${sceneProgress('dashboard') > 0.2 ? 0 : 40}px) scale(${sceneProgress('dashboard') > 0.2 ? 1 : 0.95})`,
                            transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
                        }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="text-xs font-bold text-white/80">📈 월별 매출 추이</div>
                            <div className="flex-1" />
                            <div className="text-[10px] text-emerald-400 font-bold">+18.3% ↑</div>
                        </div>
                        {/* Animated Chart Bars */}
                        <div className="flex items-end gap-2 h-32">
                            {[30, 42, 38, 55, 48, 62, 58, 72, 68, 85, 78, 95].map((h, i) => (
                                <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-400/60"
                                    style={{
                                        height: `${sceneProgress('dashboard') > 0.3 ? h : 2}%`,
                                        transition: `height 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s`,
                                        opacity: sceneProgress('dashboard') > 0.25 ? 1 : 0.3,
                                    }}
                                />
                            ))}
                        </div>
                        <div className="flex justify-between mt-2">
                            {['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'].map((m, i) => (
                                <span key={i} className="text-[8px] text-white/20 flex-1 text-center">{m}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ===== SCENE: SCHEDULE ===== */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center px-6 md:px-12"
                    style={{
                        opacity: isVisible('schedule') ? 1 : 0,
                        visibility: isVisible('schedule') ? 'visible' : 'hidden',
                        transition: 'opacity 0.4s ease, visibility 0.4s',
                        zIndex: isVisible('schedule') ? 10 : 1,
                        pointerEvents: isVisible('schedule') ? 'auto' : 'none',
                    }}
                >
                    <p className="text-indigo-400 text-xs font-bold tracking-[3px] uppercase mb-3"
                        style={{ opacity: sceneProgress('schedule') > 0.05 ? 1 : 0, transition: 'opacity 0.5s' }}>
                        SMART SCHEDULING
                    </p>
                    <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight text-center mb-8"
                        style={{
                            opacity: sceneProgress('schedule') > 0.1 ? 1 : 0,
                            transform: `translateY(${sceneProgress('schedule') > 0.1 ? 0 : 20}px)`,
                            transition: 'all 0.6s ease',
                        }}>
                        스마트 스케줄 관리
                    </h3>

                    {/* Mock Calendar */}
                    <div
                        className="w-full max-w-2xl bg-white/[0.03] border border-white/10 rounded-2xl p-4 md:p-6"
                        style={{
                            opacity: sceneProgress('schedule') > 0.15 ? 1 : 0,
                            transform: `scale(${sceneProgress('schedule') > 0.15 ? 1 : 0.95})`,
                            transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
                        }}
                    >
                        {/* Week header */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['일', '월', '화', '수', '목', '금', '토'].map(d => (
                                <div key={d} className="text-center text-[10px] text-white/30 font-bold py-1">{d}</div>
                            ))}
                        </div>
                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: 28 }, (_, i) => {
                                const hasSession = [2, 4, 5, 8, 10, 11, 12, 15, 17, 18, 19, 22, 24, 25].includes(i + 1);
                                const colors = ['bg-indigo-500/40', 'bg-emerald-500/40', 'bg-pink-500/40', 'bg-amber-500/40'];
                                const randomColor = colors[i % colors.length];
                                const delay = i * 0.02;
                                return (
                                    <div key={i} className="aspect-square rounded-lg bg-white/[0.02] border border-white/5 p-1 relative overflow-hidden"
                                        style={{
                                            opacity: sceneProgress('schedule') > 0.2 + delay ? 1 : 0,
                                            transition: `opacity 0.3s ease ${delay}s`,
                                        }}
                                    >
                                        <span className="text-[9px] text-white/30">{i + 1}</span>
                                        {hasSession && (
                                            <div className={cn("absolute bottom-1 left-1 right-1 h-1.5 rounded-full", randomColor)}
                                                style={{
                                                    transform: `scaleX(${sceneProgress('schedule') > 0.4 ? 1 : 0})`,
                                                    transition: `transform 0.4s ease ${delay + 0.3}s`,
                                                    transformOrigin: 'left',
                                                }}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ===== SCENE: MULTI-CENTER ===== */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center px-6 md:px-12"
                    style={{
                        opacity: isVisible('multicenter') ? 1 : 0,
                        visibility: isVisible('multicenter') ? 'visible' : 'hidden',
                        transition: 'opacity 0.4s ease, visibility 0.4s',
                        zIndex: isVisible('multicenter') ? 10 : 1,
                        pointerEvents: isVisible('multicenter') ? 'auto' : 'none',
                    }}
                >
                    <p className="text-indigo-400 text-xs font-bold tracking-[3px] uppercase mb-3"
                        style={{ opacity: sceneProgress('multicenter') > 0.05 ? 1 : 0, transition: 'opacity 0.5s' }}>
                        MULTI-CENTER SAAS
                    </p>
                    <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight text-center mb-10"
                        style={{
                            opacity: sceneProgress('multicenter') > 0.1 ? 1 : 0,
                            transform: `translateY(${sceneProgress('multicenter') > 0.1 ? 0 : 20}px)`,
                            transition: 'all 0.6s ease',
                        }}>
                        각 센터만의 전용 홈페이지
                    </h3>

                    <div className="flex gap-4 md:gap-6 w-full max-w-2xl justify-center">
                        {[
                            { name: '자라다 잠실점', color: 'from-indigo-600/30', delay: 0 },
                            { name: '다산 위드미', color: 'from-emerald-600/30', delay: 0.15 },
                            { name: '서울세계로', color: 'from-amber-600/30', delay: 0.3 },
                        ].map((center, i) => (
                            <div
                                key={i}
                                className={cn("flex-1 bg-gradient-to-b to-transparent border border-white/10 rounded-2xl overflow-hidden", center.color)}
                                style={{
                                    opacity: sceneProgress('multicenter') > 0.15 + center.delay ? 1 : 0,
                                    transform: `translateY(${sceneProgress('multicenter') > 0.15 + center.delay ? 0 : 40}px)`,
                                    transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${center.delay}s`,
                                }}
                            >
                                {/* Mock hero */}
                                <div className="h-20 md:h-28 bg-gradient-to-br from-white/5 to-transparent flex items-end p-3 md:p-4">
                                    <div className="w-6 h-6 md:w-8 md:h-8 bg-white/10 rounded-lg" />
                                </div>
                                <div className="p-3 md:p-4">
                                    <div className="text-xs md:text-sm font-bold text-white/80">{center.name}</div>
                                    <div className="text-[10px] text-white/30 mt-1">센터 소개 · 프로그램 · 문의</div>
                                    <div className="mt-3 flex gap-1">
                                        <div className="h-1.5 flex-1 bg-white/10 rounded-full" />
                                        <div className="h-1.5 w-8 bg-indigo-500/30 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ===== SCENE: CTA ===== */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    style={{
                        opacity: isVisible('cta') ? 1 : 0,
                        visibility: isVisible('cta') ? 'visible' : 'hidden',
                        transition: 'opacity 0.4s ease, visibility 0.4s',
                        zIndex: isVisible('cta') ? 10 : 1,
                        pointerEvents: isVisible('cta') ? 'auto' : 'none',
                    }}
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-purple-500/10 blur-[80px]" />

                    <h3
                        className="relative text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter text-center"
                        style={{
                            opacity: sceneProgress('cta') > 0.1 ? 1 : 0,
                            transform: `translateY(${sceneProgress('cta') > 0.1 ? 0 : 30}px)`,
                            transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
                        }}
                    >
                        지금 바로
                        <br />
                        <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            시작하세요.
                        </span>
                    </h3>

                    <p
                        className="relative text-white/40 text-sm md:text-base mt-4 text-center"
                        style={{
                            opacity: sceneProgress('cta') > 0.2 ? 1 : 0,
                            transition: 'opacity 0.6s ease 0.1s',
                        }}
                    >
                        Zarada와 함께 센터 운영의 새로운 기준을 경험하세요.
                    </p>

                    <div
                        className="relative mt-8 px-8 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-sm tracking-tight shadow-lg shadow-indigo-500/30"
                        style={{
                            opacity: sceneProgress('cta') > 0.35 ? 1 : 0,
                            transform: `scale(${sceneProgress('cta') > 0.35 ? 1 : 0.8})`,
                            transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s',
                        }}
                    >
                        zarada.co.kr →
                    </div>

                    {/* Logo watermark */}
                    <div
                        className="absolute bottom-8 text-white/20 text-xs font-black tracking-[4px]"
                        style={{
                            opacity: sceneProgress('cta') > 0.5 ? 1 : 0,
                            transition: 'opacity 0.6s ease',
                        }}
                    >
                        ZARADA
                    </div>
                </div>

                {/* ===== PLAY OVERLAY (when not started) ===== */}
                {!isPlaying && elapsed === 0 && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer"
                        onClick={() => setIsPlaying(true)}>
                        <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:scale-110 transition-transform">
                            <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors shrink-0"
                >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                {/* Progress bar */}
                <div className="flex-1 relative">
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-[width] duration-100"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {/* Scene markers */}
                    <div className="flex justify-between mt-2">
                        {SCENES.map(s => (
                            <button
                                key={s.id}
                                onClick={() => { setElapsed(s.start); setIsPlaying(true); }}
                                className={cn(
                                    "text-[10px] font-bold transition-colors cursor-pointer",
                                    currentScene.id === s.id ? "text-indigo-500" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                )}
                            >
                                {s.id === 'intro' ? '인트로' :
                                    s.id === 'kpi' ? 'KPI' :
                                        s.id === 'dashboard' ? '대시보드' :
                                            s.id === 'schedule' ? '스케줄' :
                                                s.id === 'multicenter' ? '멀티센터' : 'CTA'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Timer */}
                <div className="text-xs font-mono text-slate-400 shrink-0 tabular-nums">
                    {String(Math.floor(elapsed / 60000)).padStart(2, '0')}:
                    {String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0')} /
                    0:{String(Math.floor(TOTAL_DURATION / 1000)).padStart(2, '0')}
                </div>
            </div>
        </div>
    );
}

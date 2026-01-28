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
import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
    Home, Sparkles, User, Calendar as CalendarIcon,
    MessageSquare, ChevronLeft, ChevronRight, Activity, Info, Quote
} from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';

// 📊 Recharts for Horizontal Bar Chart
import {
    BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Cell, Tooltip
} from 'recharts';

// 캘린더 라이브러리
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';

import { ConsultationSurveyModal } from '@/components/public/ConsultationSurveyModal';
import { InvitationCodeModal } from '@/components/InvitationCodeModal';
import { DynamicHomeCareTips } from '@/components/public/DynamicHomeCareTips';
import { Skeleton } from '@/components/common/Skeleton';

// 🎨 Brand Colors for Chart
const CHART_COLORS = [
    '#6366f1', // Indigo - 의사소통
    '#ec4899', // Pink - 사회성
    '#8b5cf6', // Violet - 인지
    '#f59e0b', // Amber - 운동
    '#10b981', // Emerald - 적응
];

export function ParentHomePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getSetting } = useAdminSettings();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const dateInputRef = useRef(null);

    // 상태 관리
    const [childInfo, setChildInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSurveyOpen, setIsSurveyOpen] = useState(false);

    const [calendarEvents, setCalendarEvents] = useState([]);
    const [allLogs, setAllLogs] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [filterDate, setFilterDate] = useState('');
    const [hasUpcomingConsultation, setHasUpcomingConsultation] = useState(false);
    const [showInvitationModal, setShowInvitationModal] = useState(false);
    // ✨ 관찰 일기 상태
    const [observationText, setObservationText] = useState('');
    const [savingObs, setSavingObs] = useState(false);
    // ✨ 지능형 홈 케어 팁 상태
    const [smartTips, setSmartTips] = useState([]);

    useEffect(() => {
        if (user?.id) fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // ✨ [자녀 연결 감지] children + family_relationships 체크
            let child = null;

            // 1. parents 테이블에서 프로필(user.id)에 해당하는 레코드 ID 찾기
            const { data: parentRecord } = await supabase
                .from('parents')
                .select('id')
                .eq('profile_id', user.id)
                .maybeSingle();

            // 2. children.parent_id (Legacy) 또는 family_relationships (New) 체크
            if (parentRecord) {
                const { data: directChild } = await supabase
                    .from('children')
                    .select('*')
                    .eq('parent_id', parentRecord.id)
                    .maybeSingle();
                if (directChild) child = directChild;
            }

            if (!child) {
                // 3. family_relationships 테이블에서 체크 (Junction)
                const { data: relationship } = await supabase
                    .from('family_relationships')
                    .select('child_id, children(*)')
                    .eq('parent_id', user.id)
                    .maybeSingle();

                if (relationship?.children) {
                    child = relationship.children;
                }
            }

            if (child) {
                setChildInfo(child);
                setShowInvitationModal(false);

                // 일정 데이터 가져오기
                const { data: schedules } = await supabase
                    .from('schedules')
                    .select(`
                        id, date, start_time, end_time, status,
                        programs (name),
                        therapists (name, color)
                    `)
                    .eq('child_id', child.id)
                    .neq('status', 'cancelled')
                    .order('date', { ascending: true });

                if (schedules) {
                    const events = schedules.map(s => ({
                        id: s.id,
                        title: `${s.programs?.name || '수업'} (${s.therapists?.name})`,
                        start: s.start_time,
                        end: s.end_time,
                        backgroundColor: s.therapists?.color || '#3b82f6',
                        borderColor: s.therapists?.color || '#3b82f6',
                        textColor: '#ffffff',
                    }));
                    setCalendarEvents(events);

                    // ✨ 다가오는 상담/평가 일정 확인
                    const today = new Date().toISOString();
                    const nextConsult = schedules.find(s =>
                        s.start_time > today &&
                        (s.programs?.name?.includes('상담') || s.programs?.name?.includes('평가'))
                    );
                    if (nextConsult) setHasUpcomingConsultation(true);
                }

                // 상담 일지 가져오기
                // ✨ [FIX] 상담 일지(실제 성장 리포트) 가져오기
                // consultations(문의)가 아닌 development_assessments(평가) + counseling_logs(내용) 조회
                // 🚀 [Optimization] SQL 레벨에서 최신 2개만 가져오도록 최적화 (Comparison Logic용)
                // 단, 전체 리스트가 필요하다면 limit을 없애야 하지만, 성능 문제 지적에 따라 limit을 적용함.
                // 타임라인 슬라이더가 2개만 나오게 됨.
                // ✨ [FIX] 상담 일지(counseling_logs)를 메인으로 조회하여, 평가서가 없어도 일지가 보이도록 수정
                // Left Join: counseling_logs -> development_assessments
                const { data: logs } = await supabase
                    .from('counseling_logs')
                    .select(`
                        id,
                        created_at,
                        content,
                        activities,
                        child_response,
                        next_plan,
                        parent_feedback,
                        therapists:therapist_id (name),
                        development_assessments (
                            score_communication, score_social, score_cognitive, score_motor, score_adaptive,
                            evaluation_content
                        )
                    `)
                    .eq('child_id', child.id)
                    .order('created_at', { ascending: false })
                    .limit(5); // Show last 5 logs

                // UI에 맞게 데이터 매핑
                const formattedLogs = logs?.map(log => {
                    const assessment = log.development_assessments?.[0] || log.development_assessments; // Handle array or single object

                    return {
                        ...log,
                        // 콘텐츠 우선순위: 부모 피드백 -> 평가 상세 -> 일지 내용 -> 없음
                        content: log.parent_feedback || assessment?.evaluation_content || log.content || '작성된 내용이 없습니다.',
                        // 평가 점수가 있으면 매핑, 없으면 null (그래프 숨김 처리)
                        domain_scores: assessment ? {
                            '의사소통': assessment.score_communication,
                            '사회성': assessment.score_social,
                            '인지': assessment.score_cognitive,
                            '운동': assessment.score_motor,
                            '적응': assessment.score_adaptive
                        } : null
                    };
                });
                setAllLogs(formattedLogs || []);

                // ✨ [Smart Logic] 최신 평가 기반 취약 영역 분석 및 팁 추천 (Removed, now handled by DynamicHomeCareTips)
                // if (formattedLogs && formattedLogs.length > 0) {
                //     const latest = formattedLogs[0];
                //     const scores = {
                //         'communication': latest.score_communication || 0,
                //         'social': latest.score_social || 0,
                //         'cognitive': latest.score_cognitive || 0,
                //         'motor': latest.score_motor || 0,
                //         'adaptive': latest.score_adaptive || 0
                //     };

                //     // 점수가 가장 낮은 영역 찾기 (여러 개일 경우 첫 번째)
                //     const sortedDomains = Object.entries(scores).sort(([, a], [, b]) => a - b);
                //     const lowestDomain = sortedDomains[0][0]; // e.g., 'social'

                //     console.log('🔍 [Smart Analysis] Lowest Domain:', lowestDomain);

                //     // 해당 영역의 팁 가져오기 (DB 연동)
                //     const { data: tips } = await supabase
                //         .from('home_care_tips')
                //         .select('*')
                //         .eq('category', lowestDomain)
                //         .limit(2);

                //     setSmartTips(tips || []);
                // }

            } else {
                // ✨ [초대 코드 모달] 연결된 자녀가 없고 '부모' 권한일 때만 모달 표시
                // 슈퍼 어드민이나 치료사는 굳이 이 모달을 볼 필요가 없음
                const isParent = user?.user_metadata?.role === 'parent' || user?.role === 'parent';
                // Note: AuthContext might not have role fully set yet if we use user object directly, 
                // but we can trust checking context role if available. 
                // Ideally we use the 'role' from useAuth() hook.
                if (isParent) {
                    setShowInvitationModal(true);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (e) => {
        const date = e.target.value;
        if (!date) return;
        setFilterDate(date);
        const foundIndex = allLogs.findIndex(log => log.created_at.startsWith(date));
        if (foundIndex !== -1) setCurrentIndex(foundIndex);
    };
    const nextSlide = () => { if (currentIndex < allLogs.length - 1) setCurrentIndex(prev => prev + 1); };
    const prevSlide = () => { if (currentIndex > 0) setCurrentIndex(prev => prev - 1); };

    // ✨ 관찰 일기 저장 핸들러
    const handleSaveObservation = async () => {
        if (!observationText.trim() || !childInfo?.id || !user?.id) return;
        setSavingObs(true);
        try {
            const { error } = await supabase.from('parent_observations').insert({
                parent_id: user.id,
                child_id: childInfo.id,
                content: observationText.trim(),
                observation_date: new Date().toISOString().split('T')[0]
            });
            if (error) throw error;
            alert('관찰 일기가 저장되었습니다! 🌟');
            setObservationText('');
        } catch (e) {
            console.error(e);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setSavingObs(false);
        }
    };

    if (loading) {
        return (
            <div className={cn("min-h-screen font-sans pb-20 transition-colors", isDark ? "bg-slate-950" : "bg-[#FDFCFB]")}>
                <nav className="sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b shadow-sm bg-white/90 backdrop-blur-sm border-slate-100">
                    <Skeleton className="w-20 h-6 rounded-md" />
                    <Skeleton className="w-24 h-6 rounded-full" />
                </nav>
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-8 pt-16 pb-20">
                    <div className="max-w-4xl mx-auto relative z-10 flex justify-between items-end">
                        <div className="space-y-4 w-2/3">
                            <Skeleton className="w-32 h-6 rounded-full bg-white/20" />
                            <Skeleton className="w-full max-w-md h-12 rounded-lg bg-white/20" />
                            <Skeleton className="w-48 h-4 rounded bg-white/20" />
                        </div>
                        <Skeleton className="w-32 h-12 rounded-2xl bg-white/20 hidden md:block" />
                    </div>
                </div>
                <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-20">
                    <Skeleton className="w-full h-24 rounded-[28px] shadow-lg" />
                </div>
                <div className="max-w-4xl mx-auto p-8 space-y-12 mt-8">
                    <Skeleton className="w-full h-96 rounded-[32px]" />
                    <Skeleton className="w-full h-80 rounded-[48px]" />
                </div>
            </div>
        );
    }

    const kakaoUrl = getSetting('kakao_url');

    return (
        <div className={cn("min-h-screen font-sans pb-20 transition-colors", isDark ? "bg-slate-950 text-slate-100" : "bg-[#FDFCFB] text-[#1e293b]")}>
            {/* 🚀 [SEO] Global SEOHead가 적용되므로 하드코딩 Helmet 삭제됨 */}

            <ConsultationSurveyModal
                isOpen={isSurveyOpen}
                onClose={() => setIsSurveyOpen(false)}
                centerId={childInfo?.center_id} // ✨ Pass centerId from childInfo
                initialData={{
                    childName: childInfo?.name,
                    childBirthDate: childInfo?.birth_date,
                    childGender: childInfo?.gender,
                    childId: childInfo?.id,
                    guardianName: user?.user_metadata?.name || '',
                    guardianPhone: user?.phone || ''
                }}
            />

            {/* ✨ 초대 코드 입력 모달 (연결된 자녀 없을 시) */}
            <InvitationCodeModal
                isOpen={showInvitationModal}
                onClose={() => setShowInvitationModal(false)}
                onSuccess={(childName) => {
                    alert(`🎉 ${childName} 어린이와 성공적으로 연결되었습니다!`);
                    fetchDashboardData();
                }}
                parentId={user?.id}
            />

            <nav className={cn(
                "sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b shadow-sm",
                isDark ? "bg-slate-900/90 border-slate-800" : "bg-white/90 backdrop-blur-sm border-slate-100"
            )}>
                <button onClick={() => navigate('/')} className={cn("flex items-center gap-2 font-bold text-xs", isDark ? "text-slate-300" : "text-slate-900")}><Home className="w-4 h-4" /> 홈으로</button>
                <div className={cn("px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase italic", isDark ? "bg-indigo-900 text-indigo-300" : "bg-primary/10 text-primary")}>Parent Mode</div>
            </nav>

            {/* ✨ 상담 확정 알림 배너 */}
            {hasUpcomingConsultation && kakaoUrl && (
                <div className="bg-yellow-400 text-slate-900 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-1.5 rounded-full"><MessageCircle className="w-4 h-4" /></div>
                        <p className="text-sm font-bold">
                            상담 예약이 확정되었습니다! 궁금한 점은 카카오톡으로 문의해주세요.
                        </p>
                    </div>
                    <a href={kakaoUrl} target="_blank" rel="noreferrer" className="text-xs font-black bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                        채팅하기
                    </a>
                </div>
            )}

            <header className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-8 pt-16 pb-20">
                {/* Decorative Blobs - reduced blur */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-lg"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="flex items-end justify-between">
                        <div className="space-y-4 text-white">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-black uppercase tracking-wider">
                                <Sparkles className="w-3 h-3" /> Parent Dashboard
                            </div>
                            <h1
                                className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.03em]"
                                style={{ wordBreak: 'keep-all' }}
                            >
                                {childInfo?.name} 보호자님,<br />
                                오늘도 응원합니다! 💪
                            </h1>
                            <p className="text-white/70 text-sm font-medium">
                                {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsSurveyOpen(true)}
                            className="hidden md:flex bg-white text-indigo-700 px-6 py-3 rounded-2xl font-black text-sm shadow-lg hover:bg-indigo-50 active:scale-95 transition-all items-center gap-2 ring-2 ring-white/20"
                        >
                            <MessageSquare className="w-4 h-4" /> 상담 신청
                        </button>
                    </div>
                </div>
            </header>

            {/* Mood Check Banner */}
            <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-20">
                <div className={cn(
                    "rounded-[28px] p-6 shadow-lg border flex items-center justify-between",
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-indigo-100/30"
                )}>
                    <div className="flex items-center gap-4">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-2xl", isDark ? "bg-amber-900/30" : "bg-amber-50")}>☀️</div>
                        <div>
                            <p className={cn("text-sm font-black", isDark ? "text-white" : "text-slate-800")} style={{ wordBreak: 'keep-all' }}>
                                오늘 {childInfo?.name}의 컨디션은 어떤가요?
                            </p>
                            <p className={cn("text-xs font-medium", isDark ? "text-slate-500" : "text-slate-400")}>가정에서의 상태를 기록해보세요</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {['😊', '😐', '😢'].map((emoji, idx) => (
                            <button
                                key={idx}
                                className={cn(
                                    "w-11 h-11 rounded-xl hover:scale-110 transition-all text-xl border",
                                    isDark ? "bg-slate-800 hover:bg-indigo-900 border-slate-700" : "bg-slate-50 hover:bg-indigo-50 border-slate-100"
                                )}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-12 mt-8">

                {/* 1. 수업 일정 캘린더 */}
                <section>
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        <h2 className={cn("text-xl font-black", isDark ? "text-white" : "text-slate-900")}>수업 일정표</h2>
                    </div>
                    <div className={cn(
                        "rounded-[32px] p-2 md:p-8 shadow-lg border bg-white overflow-hidden",
                        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-slate-200/50"
                    )}>
                        <style>{`
                            .fc { font-family: 'Pretendard', sans-serif; --fc-border-color: transparent; } 
                            .fc table, .fc-scrollgrid { table-layout: fixed !important; width: 100% !important; }
                            .fc-header-toolbar { flex-wrap: wrap; gap: 8px; margin-bottom: 24px !important; }
                            .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 800 !important; }
                            .fc-button { border-radius: 12px !important; font-weight: 700 !important; padding: 8px 16px !important; text-transform: capitalize; }
                            
                            /* ✨ Event Styling */
                            .fc-event {
                                cursor: pointer;
                                border: none !important;
                                padding: 1px 2px !important;
                                margin-bottom: 1px !important;
                                white-space: normal !important;
                                height: auto !important;
                            }
                            .fc-event-main {
                                font-weight: 700;
                                font-size: 0.75rem;
                                line-height: 1.1;
                                word-break: break-all; /* Force break everywhere */
                            }
                            .fc-daygrid-event-dot { display: none; }
                            
                            /* Mobile Optimization */
                            @media (max-width: 768px) {
                                .fc-header-toolbar { flex-direction: column; align-items: flex-start; gap: 8px; margin-bottom: 12px !important; }
                                .fc-toolbar-title { font-size: 1rem !important; }
                                .fc-event-main { font-size: 0.65rem !important; }
                                .fc-col-header-cell-cushion { font-size: 0.75rem !important; padding: 4px 0 !important; }
                                .fc-daygrid-day-number { font-size: 0.7rem !important; padding: 2px !important; }
                                .fc-button { padding: 4px 8px !important; font-size: 0.75rem !important; }
                            }

                            ${isDark ? `
                            .fc { --fc-border-color: #334155; --fc-page-bg-color: #0f172a; }
                            .fc-theme-standard td, .fc-theme-standard th { border-color: #334155 !important; }
                            .fc-day-today { background-color: #1e293b !important; }
                            .fc-event { color: #ffffff !important; }
                            .fc-button { background-color: #1e293b !important; border-color: #334155 !important; color: #e2e8f0 !important; }
                            .fc-button-active { background-color: #334155 !important; }
                            .fc-toolbar-title { color: #f1f5f9 !important; }
                            ` : `
                            .fc-button { background-color: #ffffff !important; border: 1px solid #e2e8f0 !important; color: #64748b !important; box-shadow: none !important; }
                            .fc-button-active { background-color: #f1f5f9 !important; color: #0f172a !important; }
                            .fc-day-today { background-color: #fff7ed !important; }
                            .fc-col-header-cell-cushion { color: #64748b; font-weight: 800; font-size: 0.9rem; padding: 12px 0 !important; }
                            .fc-daygrid-day-number { color: #334155; font-weight: 600; }
                            `}
                        `}</style>
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            locale={koLocale}
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: ''
                            }}
                            buttonText={{ today: '오늘' }}
                            events={calendarEvents}
                            height="auto"
                            contentHeight="auto"
                            dayMaxEvents={true}
                            moreLinkClick="popover"
                            editable={false}
                            selectable={false}
                            eventContent={(eventInfo) => (
                                <div className="flex flex-col h-auto">
                                    <span className="break-words leading-tight">{eventInfo.event.title}</span>
                                </div>
                            )}
                            eventClick={(info) => alert(`${info.event.title}\n시간: ${info.event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)}
                            noEventsContent="예정된 수업이 없습니다."
                        />
                    </div>
                </section>

                {/* 2. 성장 타임라인 리포트 */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" /> 성장 타임라인
                        </h3>
                        <div className="relative cursor-pointer" onClick={() => dateInputRef.current.showPicker()}>
                            <input type="date" ref={dateInputRef} value={filterDate} onChange={handleDateChange} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-20" />
                            <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl text-[11px] font-black text-slate-600 border border-slate-200 shadow-sm hover:border-primary/30 transition-all">
                                <CalendarIcon className="w-3.5 h-3.5 text-primary" /> {filterDate || '날짜 검색'}
                            </button>
                        </div>
                    </div>

                    {allLogs.length > 0 ? (
                        <div className="relative group">
                            <div className="bg-white rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col transition-all">
                                <div className="p-8 bg-slate-50/50 border-b border-slate-50 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm font-black text-primary border border-primary/10 text-lg">{(currentIndex + 1).toString().padStart(2, '0')}</div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Report Date</p>
                                            <p className="text-sm font-black text-slate-900">{new Date(allLogs[currentIndex].created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs font-black text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10">{allLogs[currentIndex].therapists?.name} 선생님</p>
                                </div>

                                <div className="p-8 space-y-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-primary font-black text-[11px] uppercase tracking-widest leading-none"><MessageSquare className="w-4 h-4 fill-primary/10" /> 선생님 피드백</div>
                                        <p className="text-[#334155] font-bold leading-relaxed text-[16px] whitespace-pre-wrap pl-1 tracking-tight bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                            {allLogs[currentIndex].content}
                                        </p>
                                    </div>

                                    {allLogs[currentIndex].domain_scores && (
                                        <div className="pt-8 border-t border-slate-100 space-y-6">
                                            <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest"><Activity className="w-4 h-4" /> 영역별 성취도</div>
                                            {/* ✨ Recharts Horizontal Bar Chart */}
                                            <div style={{ width: '100%', minHeight: 280 }}>
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <BarChart
                                                        layout="vertical"
                                                        data={Object.entries(allLogs[currentIndex].domain_scores).map(([name, value], idx) => ({ name, value, fill: CHART_COLORS[idx % CHART_COLORS.length] }))}
                                                        margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                                                        barCategoryGap="20%"
                                                    >
                                                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#334155', fontWeight: 700 }} axisLine={false} tickLine={false} width={70} />
                                                        <Tooltip formatter={(value) => [`${value}점`, '점수']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                        <Bar dataKey="value" radius={[0, 8, 8, 0]} animationDuration={1200}>
                                                            {Object.entries(allLogs[currentIndex].domain_scores).map((_, idx) => (
                                                                <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                                            ))}
                                                            <LabelList dataKey="value" position="right" formatter={(v) => `${v}점`} style={{ fontSize: 12, fontWeight: 800, fill: '#1e293b' }} />
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="bg-indigo-50 p-5 rounded-[24px] flex items-start gap-3 border border-indigo-100/50">
                                                <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                                <p className="text-[11px] text-indigo-700 font-bold leading-snug">본 그래프는 아이의 발달 상태를 이해하기 위한 참고용 데이터입니다.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-8 px-4">
                                <button onClick={prevSlide} disabled={currentIndex === 0} className="w-14 h-14 rounded-full flex items-center justify-center transition-all bg-white text-slate-900 shadow-xl active:scale-90 border border-slate-100 disabled:opacity-20 disabled:shadow-none"><ChevronLeft className="w-6 h-6" /></button>
                                <div className="flex gap-2">
                                    {allLogs.slice(0, 5).map((_, idx) => (<div key={idx} className={`h-1.5 rounded-full transition-all ${currentIndex === idx ? 'w-8 bg-indigo-600' : 'w-1.5 bg-slate-200'}`}></div>))}
                                </div>
                                <button onClick={nextSlide} disabled={currentIndex === allLogs.length - 1} className="w-14 h-14 rounded-full flex items-center justify-center transition-all bg-white text-slate-900 shadow-xl active:scale-90 border border-slate-100 disabled:opacity-20 disabled:shadow-none"><ChevronRight className="w-6 h-6" /></button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-6">
                            <div className="text-center">
                                <p className="text-slate-400 font-bold text-sm italic mb-2">등록된 성장 리포트가 없습니다.</p>
                                <p className="text-xs text-slate-300">치료사가 평가를 작성하면 이곳에 표시됩니다.</p>
                            </div>

                            {/* ✨ [Observation Diary] 부모 관찰 일기 입력 */}
                            <div className="pt-6 border-t border-slate-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-sm">📝</div>
                                    <h4 className="font-black text-slate-700 text-sm">오늘의 관찰 일기</h4>
                                </div>
                                <textarea
                                    value={observationText}
                                    onChange={(e) => setObservationText(e.target.value)}
                                    placeholder="오늘 아이에게서 발견한 작은 변화나 특별한 순간을 기록해보세요..."
                                    className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:border-indigo-300 focus:bg-white outline-none resize-none transition-all"
                                    rows={4}
                                />
                                <div className="flex justify-end mt-3">
                                    <button
                                        onClick={handleSaveObservation}
                                        disabled={savingObs || !observationText.trim()}
                                        className="px-5 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {savingObs ? '저장 중...' : '저장하기'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* 4. 지능형 홈 케어 팁 (Dynamic) */}
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[10px]">✨</div>
                        <h2 className={cn("text-xl font-black", isDark ? "text-white" : "text-slate-900")}>
                            {childInfo?.name}를 위한 맞춤 케어 팁
                        </h2>
                    </div>

                    <DynamicHomeCareTips latestAssessment={allLogs[0]} />
                </section>

            </main>
        </div>
    );
}
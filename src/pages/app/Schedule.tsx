
/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-11
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 상담일지 및 발달 관리 - AssessmentFormModal 통합
 */
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';
import type { EventClickArg, EventInput } from '@fullcalendar/core';
import { Plus, Loader2, Clock, User } from 'lucide-react';
import { ScheduleModal } from '@/components/app/schedule/ScheduleModal';
import { useAuth } from '@/contexts/AuthContext'; // ✨ Import
import { useCenter } from '@/contexts/CenterContext'; // ✨ Import
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { SUPER_ADMIN_EMAILS } from '@/config/superAdmin';

// ✨ 스케줄 상태 타입
type ScheduleStatus = 'scheduled' | 'completed' | 'canceled' | 'cancelled' | 'carried_over';

// ✨ 치료사 필터 옵션 타입
interface TherapistOption {
    id: string;
    name: string;
    color: string;
}

// ✨ FullCalendar extendedProps 타입
interface ScheduleExtendedProps {
    status: ScheduleStatus;
    child_id: string;
    program_id: string | null;
    therapist_id: string;
    date: string;
    start_time: string;
    end_time: string;
    childName: string;
    programName: string;
    therapistName: string;
    color: string;
    hasNote: boolean;
}

// ✨ 툴팁 정보 타입
interface TooltipInfo {
    event: {
        title: string;
        start: Date | null;
        end: Date | null;
        extendedProps: ScheduleExtendedProps;
    };
    x: number;
    y: number;
}

// ✨ Supabase 스케줄 데이터 타입
interface ScheduleData {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    status: ScheduleStatus;
    notes: string | null;
    service_type: string | null;
    child_id: string;
    therapist_id: string;
    program_id: string | null;
    children: { name: string; center_id: string } | null;
    programs: { name: string } | null;
    therapists: { name: string; color: string } | null;
}

export function Schedule() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { center } = useCenter(); // ✨ Use Center Context
    const centerId = center?.id;

    const [events, setEvents] = useState<EventInput[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
    const [clickedDate, setClickedDate] = useState<Date | ScheduleExtendedProps | null>(null);
    const [tooltipInfo, setTooltipInfo] = useState<TooltipInfo | null>(null);
    const calendarRef = useRef<FullCalendar | null>(null);

    // ✨ [Therapist Filter] 치료사 필터 상태 (다중 선택 지원)
    const [therapists, setTherapists] = useState<TherapistOption[]>([]);
    const [selectedTherapistIds, setSelectedTherapistIds] = useState<Set<string>>(new Set(['all']));
    const [_currentDate] = useState(new Date());

    const { role, therapistId: authTherapistId } = useAuth(); // ✨ Role & Therapist ID

    useEffect(() => {
        if (centerId && centerId.length >= 32) {
            fetchSchedules();
            fetchTherapists(centerId);
        }
    }, [centerId, authTherapistId, role]); // ✨ Added auth deps

    // ✨ [Therapist List] 치료사 목록 가져오기
    const fetchTherapists = async (targetId: string) => {
        if (!targetId || targetId.length < 32) return;
        const superAdminList = `("${SUPER_ADMIN_EMAILS.join('","')}")`;
        let query = supabase
            .from('therapists')
            .select('id, name, color')
            .eq('center_id', targetId)
            .filter('email', 'not.in', superAdminList)
            .order('name');

        // ✨ [권한 분리] 치료사는 카테고리 필터에서 자기 자신만 보거나 필터링 제한
        if (role === 'therapist' && authTherapistId) {
            query = query.eq('id', authTherapistId);
        }

        const { data } = await query;
        setTherapists(data || []);

        // 치료사 권한이면 초기 선택값을 본인 ID로 고정
        if (role === 'therapist' && authTherapistId) {
            setSelectedTherapistIds(new Set([authTherapistId]));
        }
    };

    const fetchSchedules = async () => {
        if (!centerId || centerId.length < 32) return;
        setLoading(true);
        try {
            let query = supabase
                .from('schedules')
                .select(`
                    id, date, start_time, end_time, status, notes, service_type,
                    child_id, therapist_id, program_id,
                    children (name, center_id),
                    programs (name),
                    therapists (name, color)
                `)
                .eq('center_id', centerId);

            // ✨ [권한 분리] 행정직원(admin, manager, staff)은 전체 조회 가능
            // 치료사(therapist)는 본인의 일정만 조회 가능
            if (role === 'therapist' && authTherapistId) {
                query = query.eq('therapist_id', authTherapistId);
            }

            const { data, error } = await query;
            const scheduleData = data as ScheduleData[] | null;

            if (error) throw error;

            // ✨ [Auto-Completion Logic]
            // Mark past 'scheduled' events as 'completed' automatically
            const now = new Date();
            const pastScheduledIds = scheduleData
                ?.filter(s => s.status === 'scheduled' && new Date(`${s.date}T${s.end_time}`) < now)
                .map(s => s.id) || [];

            if (pastScheduledIds.length > 0) {
                await (supabase
                    .from('schedules') as any)
                    .update({ status: 'completed' })
                    .in('id', pastScheduledIds);

                // Update local data to reflect the change
                scheduleData?.forEach((s: ScheduleData) => {
                    if (pastScheduledIds.includes(s.id)) {
                        (s as { status: string }).status = 'completed';
                    }
                });
            }

            let attendedLogIds = new Set();
            if (scheduleData && scheduleData.length > 0) {
                // ✨ [Assessment Check] Fetch daily logs only if there are schedules
                // daily_logs 대신 통합된 counseling_logs를 사용합니다.
                const { data: logsData } = await supabase
                    .from('counseling_logs')
                    .select('schedule_id')
                    .in('schedule_id', scheduleData.map(s => s.id));

                attendedLogIds = new Set((logsData as { schedule_id: string }[] | null)?.map(l => l.schedule_id) || []);
            }
            if (scheduleData) {
                const formattedEvents = scheduleData.map((schedule: ScheduleData) => {
                    const childName = schedule.children?.name || '미등록';
                    const therapistName = schedule.therapists?.name || '미정';
                    const originalColor = schedule.therapists?.color || '#94a3b8';

                    // ✨ [취소 상태 체크 및 시각화 로직 강화]
                    const isCancelled = schedule.status === 'canceled' || schedule.status === 'cancelled';

                    // 1. 취소된 경우 색상을 회색(#cbd5e1)으로 변경, 아니면 선생님 고유색 사용
                    const eventColor = isCancelled ? '#cbd5e1' : originalColor;

                    // 2. 클래스명 설정 (취소선, 흐리게 처리)
                    const eventClasses = isCancelled
                        ? ['line-through', 'opacity-50', 'grayscale', 'cancelled-event']
                        : [];

                    // ✨ [수정] 평가 작성 여부: log_id가 해당 스케줄 ID와 일치하는지 확인 (정확도 향상)
                    const hasAssessment = schedule.id && attendedLogIds.has(schedule.id);

                    return {
                        id: schedule.id,
                        title: isCancelled ? `[취소] ${childName}` : childName,
                        start: schedule.start_time,
                        end: schedule.end_time,
                        backgroundColor: eventColor + (isCancelled ? '40' : '20'),
                        borderColor: eventColor,
                        textColor: isCancelled ? '#94a3b8' : '#1e293b',
                        classNames: eventClasses,
                        extendedProps: {
                            status: schedule.status,
                            child_id: schedule.child_id,
                            program_id: schedule.program_id,
                            therapist_id: schedule.therapist_id,
                            date: schedule.date,
                            start_time: schedule.start_time,
                            end_time: schedule.end_time,
                            childName: childName,
                            programName: schedule.programs?.name || '프로그램 미정',
                            therapistName: therapistName,
                            color: eventColor,
                            hasNote: hasAssessment || !!schedule.notes  // ✨ schedule.notes로 수정 (데이터 스키마 일치)
                        }
                    };
                });
                setEvents(formattedEvents);
            }
        } catch (error) {
            console.error('일정 로딩 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEventClick = (info: EventClickArg) => {
        setSelectedScheduleId(info.event.id);
        setClickedDate(info.event.extendedProps as ScheduleExtendedProps);
        setIsModalOpen(true);
        setTooltipInfo(null);
    };

    const handleDateClick = (info: { date: Date }) => {
        setSelectedScheduleId(null);
        setClickedDate(info.date);
        setIsModalOpen(true);
    };

    const handleNewEventClick = () => {
        setSelectedScheduleId(null);
        setClickedDate(new Date());
        setIsModalOpen(true);
    };

    const handleModalClose = (shouldRefresh = false) => {
        setIsModalOpen(false);
        setSelectedScheduleId(null);
        setClickedDate(null);
        if (shouldRefresh) {
            fetchSchedules();
        }
    };

    const handleEventMouseEnter = (info: { el: HTMLElement; event: EventClickArg['event'] }) => {
        const rect = info.el.getBoundingClientRect();
        setTooltipInfo({
            event: {
                title: info.event.title,
                start: info.event.start,
                end: info.event.end,
                extendedProps: info.event.extendedProps as ScheduleExtendedProps
            },
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
        });
    };

    const handleEventMouseLeave = () => {
        setTooltipInfo(null);
    };

    const getStatusBadge = (status: ScheduleStatus) => {
        switch (status) {
            case 'completed': return { text: '출석 완료', class: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
            case 'canceled':
            case 'cancelled': return { text: '수업 취소', class: 'bg-rose-50 text-rose-600 border-rose-200' };
            case 'carried_over': return { text: '이월됨', class: 'bg-purple-50 text-purple-600 border-purple-200' };
            default: return { text: '수업 예정', class: 'bg-blue-50 text-blue-600 border-blue-200' };
        }
    };

    if (loading) return <div className={cn("flex justify-center items-center h-screen", isDark && "bg-slate-950")}><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div>;

    return (
        <>
            <Helmet><title>치료 일정 - 자라다 Admin</title></Helmet>
            <style>{`
                /* Dark Mode Calendar Styles */
                ${isDark ? `
                .fc { --fc-border-color: #334155; --fc-page-bg-color: #0f172a; }
                .fc-theme-standard td, .fc-theme-standard th { border-color: #334155; }
                .fc-scrollgrid { border-color: #334155; }
                .fc-col-header-cell-cushion, .fc-daygrid-day-number { color: #e2e8f0 !important; }
                .fc-day-today { background-color: #1e293b !important; }
                .fc-event { color: #ffffff !important; }
                .fc-event-title { color: #ffffff !important; font-weight: 700; }
                .fc-daygrid-event-dot { border-color: currentColor; }
                .fc-button { background-color: #1e293b !important; border-color: #334155 !important; color: #e2e8f0 !important; }
                .fc-button-active { background-color: #334155 !important; }
                .fc-toolbar-title { color: #f1f5f9 !important; }
                ` : `
                .fc-timegrid-slot:hover { background-color: #f1f5f9 !important; cursor: pointer; transition: background-color 0.1s; }
                .fc-daygrid-day:hover { background-color: #f8fafc !important; cursor: pointer; }
                `}
                .fc-timegrid-now-indicator-line { border-color: #ef4444; border-width: 2px; }
                .fc-timegrid-now-indicator-arrow { border-color: #ef4444; border-width: 6px; }
                .fc-event { cursor: pointer; border: none; }
                .fc-toolbar-title { font-size: 1.4rem !important; font-weight: 900 !important; color: ${isDark ? '#fff' : '#0f172a'} !important; letter-spacing: -0.02em; }
                .fc-button { 
                    font-weight: 800 !important; 
                    border-radius: 12px !important; 
                    text-transform: capitalize; 
                    padding: 8px 16px !important;
                    transition: all 0.2s !important;
                }
                .fc-button-primary {
                    background-color: ${isDark ? '#1e293b' : '#f8fafc'} !important;
                    border-color: ${isDark ? '#334155' : '#e2e8f0'} !important;
                    color: ${isDark ? '#94a3b8' : '#475569'} !important;
                }
                .fc-button-primary:hover {
                    background-color: ${isDark ? '#334155' : '#f1f5f9'} !important;
                    color: ${isDark ? '#fff' : '#0f172a'} !important;
                }
                .fc-button-active {
                    background-color: #4f46e5 !important;
                    border-color: #4f46e5 !important;
                    color: #fff !important;
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
                }
                .fc-theme-standard .fc-scrollgrid { border-radius: 24px; overflow: hidden; border: 1px solid ${isDark ? '#334155' : '#f1f5f9'}; }
                .fc-col-header-cell { padding: 12px 0 !important; background: ${isDark ? '#0f172a' : '#fdfdfd'}; text-transform: uppercase; letter-spacing: 1px; }
                .fc-col-header-cell-cushion { font-size: 11px !important; font-weight: 900 !important; color: ${isDark ? '#64748b' : '#94a3b8'} !important; }
                
                .fc-daygrid-day-number { font-size: 13px !important; font-weight: 800 !important; padding: 12px !important; }
                .fc-daygrid-day:hover { background-color: ${isDark ? '#1e293b' : '#f8fafc'} !important; }
                
                .cancelled-event { text-decoration: line-through !important; opacity: 0.6 !important; }
                
                /* ✨ Mobile Calendar Optimization - Fit to Screen */
                .fc-view-harness {
                    min-height: 400px; /* Ensure minimum height */
                }
                .fc-scrollgrid {
                    border: none !important;
                }
                
                /* 📱 Mobile Specifics */
                /* 📱 Mobile Specifics */
                @media (max-width: 640px) {
                    .fc-header-toolbar {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 12px;
                    }
                    .fc-toolbar-chunk {
                        display: flex;
                        justify-content: space-between;
                        width: 100%;
                    }
                    /* Reset Title Chunk to center */
                    .fc-toolbar-chunk:nth-child(2) {
                        justify-content: center;
                    }
                    .fc-toolbar-title {
                        font-size: 1.25rem !important;
                    }
                    .fc-button {
                        padding: 8px 16px !important;
                        font-size: 0.9rem !important;
                        flex: 1; /* Make buttons touch-friendly */
                    }
                    .fc-button-group {
                        width: 100%; /* Full width groups */
                        display: flex;
                    }

                    /* Restore simple horizontal scroll */
                    .fc-view-harness {
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                    }
                    .fc-scrollgrid {
                        min-width: 800px; /* Force grid to be wide enough */
                    }
                }
            `}</style>

            <div className={cn("flex flex-col relative", isDark && "bg-slate-900", "min-h-screen md:h-full")}>
                {/* Header removed and Button relocated to Sidebar for maximum vertical space */}

                <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 pt-4 pb-4 md:overflow-hidden">
                    {/* 1. Sidebar - Responsive (Collapsible on Mobile, Fixed on Desktop) */}
                    <aside className={cn(
                        "flex flex-col gap-5 p-5 rounded-[32px] border transition-all relative shrink-0",
                        "md:w-56 w-full md:h-auto", // Desktop: Fixed width, Mobile: Full width
                        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-200/50",
                        "max-h-[200px] md:max-h-none overflow-y-auto md:overflow-visible" // Mobile: Limit height and scroll
                    )}>
                        {/* New Schedule Button inside Sidebar */}
                        <button
                            onClick={handleNewEventClick}
                            className={cn(
                                "flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg hover:-translate-y-0.5 shrink-0",
                                isDark ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-900/20" : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200"
                            )}
                        >
                            <Plus className="w-5 h-5 stroke-[3]" /> <span className="md:inline">일정 등록</span>
                        </button>

                        <div className="hidden md:block w-full h-px bg-slate-100 dark:bg-slate-800 shrink-0" />

                        {/* Therapist Selection (Category Filter) */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">치료사 필터</h3>
                                <button
                                    onClick={() => setSelectedTherapistIds(new Set(['all']))}
                                    className="text-[10px] font-bold text-indigo-500 hover:underline"
                                >
                                    전체
                                </button>
                            </div>

                            <div className={cn(
                                "space-y-1.5 overflow-y-auto pr-1 no-scrollbar p-1",
                                "flex flex-row md:flex-col gap-2 md:gap-0 overflow-x-auto md:overflow-x-hidden" // Mobile: Horizontal Scroll
                            )}>
                                <button
                                    onClick={() => setSelectedTherapistIds(new Set(['all']))}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all shrink-0 whitespace-nowrap",
                                        "md:w-full",
                                        selectedTherapistIds.has('all')
                                            ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                                            : "hover:bg-slate-50 text-slate-500"
                                    )}
                                >
                                    <div className={cn("w-2 h-2 rounded-full shrink-0", selectedTherapistIds.has('all') ? "bg-indigo-400" : "bg-slate-300")} />
                                    <span>전체</span>
                                </button>

                                {therapists.map(t => {
                                    const isSelected = selectedTherapistIds.has(t.id);
                                    return (
                                        <button
                                            key={t.id}
                                            onClick={() => {
                                                const newSet = new Set(selectedTherapistIds);
                                                if (newSet.has('all')) newSet.delete('all');
                                                if (newSet.has(t.id)) {
                                                    newSet.delete(t.id);
                                                    if (newSet.size === 0) newSet.add('all');
                                                } else {
                                                    newSet.add(t.id);
                                                }
                                                setSelectedTherapistIds(newSet);
                                            }}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left shrink-0 whitespace-nowrap",
                                                "md:w-full",
                                                isSelected ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                            )}
                                        >
                                            <div
                                                className="w-3.5 h-3.5 rounded-md border-2 transition-all flex items-center justify-center shrink-0"
                                                style={{
                                                    borderColor: t.color,
                                                    backgroundColor: isSelected ? t.color : 'transparent'
                                                }}
                                            >
                                                {isSelected && <Plus className="w-2 h-2 text-white rotate-45" />}
                                            </div>
                                            <span className="truncate">{t.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>

                    {/* 2. Main Calendar Content (Canvas Style) */}
                    <div className={cn(
                        "flex-1 flex flex-col min-w-0 rounded-[40px] border shadow-2xl relative transition-all",
                        "md:overflow-hidden", /* FIXED: Removed overflow-hidden logic that trapped mobile scroll */
                        isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-50 shadow-slate-200/50"
                    )}>
                        <div className="flex-1 p-2 flex flex-col md:overflow-hidden"> {/* Allow scroll on mobile */}
                            <FullCalendar
                                ref={calendarRef}
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                locale={koLocale}
                                nowIndicator={true}
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                                }}
                                buttonText={{ today: '오늘', month: '월간', week: '주간', day: '일간' }}
                                events={selectedTherapistIds.has('all')
                                    ? events
                                    : events.filter(e => e.extendedProps && selectedTherapistIds.has(e.extendedProps.therapist_id as string))}
                                height="100%"
                                dayMaxEvents={5} // ✨ 인원 많아져도 볼 수 있게 최대 표시 개수 상향
                                eventDisplay="block"
                                eventClassNames="cursor-pointer hover:bg-slate-50 transition-all border-0 font-medium text-[11px] p-0 rounded-md overflow-hidden bg-transparent"
                                eventClick={handleEventClick}
                                dateClick={handleDateClick}
                                eventMouseEnter={handleEventMouseEnter}
                                eventMouseLeave={handleEventMouseLeave}
                                selectable={true}
                                selectMirror={true}
                                select={(info) => { handleDateClick({ date: info.start }); info.view.calendar.unselect(); }}
                                eventContent={(arg) => {
                                    const isCancelled = arg.event.extendedProps.status === 'canceled' || arg.event.extendedProps.status === 'cancelled';
                                    const color = arg.event.extendedProps.color;

                                    return (
                                        <div className={cn("flex items-center gap-1.5 py-0.5 px-1 truncate", isCancelled && "opacity-40 line-through")}>
                                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                            <span className={cn("truncate font-bold", isDark ? "text-slate-200" : "text-slate-700")}>
                                                {arg.event.extendedProps.childName}
                                            </span>
                                            <span className={cn("truncate opacity-60 text-[10px]", isDark ? "text-slate-400" : "text-slate-500")}>
                                                ({arg.event.extendedProps.programName})
                                            </span>
                                        </div>
                                    );
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* 툴팁 영역 */}
                <div className={`fixed z-50 bg-slate-900/95 text-white p-4 rounded-xl shadow-2xl pointer-events-none transition-opacity duration-300 ease-in-out text-sm min-w-[220px] backdrop-blur-sm ${tooltipInfo ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{ top: tooltipInfo ? tooltipInfo.y : 0, left: tooltipInfo ? tooltipInfo.x : 0, transform: 'translate(-50%, -100%) translateY(-10px)' }}>
                    {tooltipInfo && (
                        <>
                            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                                <div className="w-3 h-3 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: tooltipInfo.event.extendedProps.color }}></div>
                                <span className="font-black text-lg tracking-tight">{tooltipInfo.event.title}</span>
                            </div>
                            <div className="space-y-2 mb-3">
                                <div className="flex items-center gap-2.5 text-slate-300">
                                    <User className="w-4 h-4 text-slate-400" />
                                    <span className="font-medium">{tooltipInfo.event.extendedProps.therapistName} 선생님</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-slate-300">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span className="font-medium tracking-wide">
                                        {tooltipInfo.event.start ? new Date(tooltipInfo.event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'} - {tooltipInfo.event.end ? new Date(tooltipInfo.event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-1">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getStatusBadge(tooltipInfo.event.extendedProps.status).class}`}>
                                    {getStatusBadge(tooltipInfo.event.extendedProps.status).text}
                                </span>
                                {tooltipInfo.event.extendedProps.hasNote && (
                                    <div className="flex items-center gap-1 text-[10px] text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                                        일지 작성됨
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-slate-900/95"></div>
                        </>
                    )}
                </div>

                {isModalOpen && (
                    <ScheduleModal
                        isOpen={isModalOpen}
                        onClose={() => handleModalClose(false)}
                        scheduleId={selectedScheduleId}
                        initialDate={clickedDate}
                        onSuccess={() => handleModalClose(true)}
                    />
                )
                }
            </div >
        </>
    );
}
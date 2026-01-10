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
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';
import { Plus, Loader2, Calendar, Clock, User, FileText } from 'lucide-react';
import { ScheduleModal } from '@/components/app/schedule/ScheduleModal';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';

export function Schedule() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedScheduleId, setSelectedScheduleId] = useState(null);
    const [clickedDate, setClickedDate] = useState(null);
    const [tooltipInfo, setTooltipInfo] = useState(null);
    const calendarRef = useRef(null);

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        try {
            const { data, error } = await supabase
                .from('schedules')
                .select(`
                    id, date, start_time, end_time, status, session_note,
                    child_id, program_id, therapist_id,
                    children (name),
                    programs (name),
                    therapists (name, color)
                `);

            if (error) throw error;

            if (data) {
                const formattedEvents = data.map(schedule => {
                    const childName = schedule.children?.name || '미등록';
                    const therapistName = schedule.therapists?.name || '미정';
                    const originalColor = schedule.therapists?.color || '#94a3b8';

                    // ✨ [취소 상태 체크 및 시각화 로직 강화]
                    // Billing 페이지와 싱크를 맞추기 위해 'canceled'와 'cancelled' 모두 대응
                    const isCancelled = schedule.status === 'canceled' || schedule.status === 'cancelled';

                    // 1. 취소된 경우 색상을 회색(#cbd5e1)으로 변경, 아니면 선생님 고유색 사용
                    const eventColor = isCancelled ? '#cbd5e1' : originalColor;

                    // 2. 클래스명 설정 (취소선, 흐리게 처리)
                    const eventClasses = isCancelled
                        ? ['line-through', 'opacity-50', 'grayscale', 'cancelled-event']
                        : [];

                    return {
                        id: schedule.id,
                        // 3. 제목에 [취소] 표시 추가하여 직관성 높임
                        title: isCancelled ? `[취소] ${childName}` : childName,
                        start: schedule.start_time,
                        end: schedule.end_time,
                        backgroundColor: eventColor + (isCancelled ? '40' : '20'), // 취소 시 배경 좀 더 진하게
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
                            hasNote: !!schedule.session_note
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

    const handleEventClick = (info) => {
        setSelectedScheduleId(info.event.id);
        setClickedDate(info.event.extendedProps);
        setIsModalOpen(true);
        setTooltipInfo(null);
    };

    const handleDateClick = (info) => {
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

    const handleEventMouseEnter = (info) => {
        const rect = info.el.getBoundingClientRect();
        setTooltipInfo({
            event: info.event,
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
        });
    };

    const handleEventMouseLeave = () => {
        setTooltipInfo(null);
    };

    const getStatusBadge = (status) => {
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
                .cancelled-event { text-decoration: line-through !important; opacity: 0.6 !important; }
            `}</style>

            <div className={cn("space-y-6 h-full flex flex-col pb-6 relative", isDark && "bg-slate-950")}>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className={cn("text-3xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>치료 일정 관리</h1>
                        <p className={cn("font-medium", isDark ? "text-slate-400" : "text-slate-500")}>선생님별 색상으로 일정을 확인하세요.</p>
                    </div>
                    <button onClick={handleNewEventClick} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-sm", isDark ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-slate-900 text-white hover:bg-slate-800")}>
                        <Plus className="w-5 h-5 stroke-[2.5]" /> 새 일정 등록
                    </button>
                </div>

                <div className={cn("flex-1 p-6 rounded-3xl shadow-sm border relative z-0 overflow-hidden", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100")}>
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        locale={koLocale}
                        nowIndicator={true}
                        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
                        buttonText={{ today: '오늘', month: '월간', week: '주간', day: '일간' }}
                        events={events}
                        height="100%"
                        dayMaxEvents={true}
                        eventClassNames="cursor-pointer hover:brightness-95 transition-all border-l-4 font-bold text-xs py-0.5 px-1 rounded-r-md shadow-sm"
                        eventClick={handleEventClick}
                        dateClick={handleDateClick}
                        eventMouseEnter={handleEventMouseEnter}
                        eventMouseLeave={handleEventMouseLeave}
                        selectable={true}
                        selectMirror={true}
                        select={(info) => { handleDateClick({ date: info.start }); info.view.calendar.unselect(); }}
                    />
                </div>

                {/* 툴팁 영역 */}
                <div className={`fixed z-50 bg-slate-900/95 text-white p-4 rounded-xl shadow-2xl pointer-events-none transition-opacity duration-300 ease-in-out text-sm min-w-[220px] backdrop-blur-sm ${tooltipInfo ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{ top: tooltipInfo ? tooltipInfo.y : 0, left: tooltipInfo ? tooltipInfo.x : 0, transform: 'translate(-50%, -100%) translateY(-10px)' }}>
                    {tooltipInfo && (
                        <>
                            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                                <div className="w-3 h-3 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: tooltipInfo.event.extendedProps.color }}></div>
                                <span className="font-black text-lg tracking-tight">{tooltipInfo.event.title}</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2.5 text-slate-300">
                                    <User className="w-4 h-4 text-slate-400" />
                                    <span className="font-medium">{tooltipInfo.event.extendedProps.therapistName} 선생님</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-slate-300">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="font-bold text-white">{tooltipInfo.event.extendedProps.programName}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-slate-300">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span className="font-medium tracking-wide">
                                        {new Date(tooltipInfo.event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(tooltipInfo.event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="mt-2 pt-1 flex items-center justify-between">
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${getStatusBadge(tooltipInfo.event.extendedProps.status).class}`}>
                                        {getStatusBadge(tooltipInfo.event.extendedProps.status).text}
                                    </span>
                                    {tooltipInfo.event.extendedProps.hasNote && (
                                        <div className="flex items-center gap-1 text-xs text-yellow-400 font-bold bg-yellow-400/10 px-2 py-1 rounded-md border border-yellow-400/20">
                                            <FileText className="w-3 h-3" /> 일지 작성됨
                                        </div>
                                    )}
                                </div>
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
                )}
            </div>
        </>
    );
}
/**
 * 📱 MobileScheduleView — 케어플 스타일 모바일 캘린더
 * 상단: 콤팩트 월간 캘린더 (7열 그리드 + 이벤트 도트)
 * 하단: 선택한 날짜의 이벤트 목록
 */
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarClock, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    backgroundColor?: string;
    borderColor?: string;
    extendedProps: {
        status: string;
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
        notes: string | null;
        service_type: string | null;
    };
}

interface MobileScheduleViewProps {
    events: MobileEvent[];
    onEventClick: (eventId: string, extendedProps: MobileEvent['extendedProps']) => void;
    onDateClick?: (date: Date) => void;
    isDark: boolean;
    canEdit: boolean;
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const STATUS_MAP: Record<string, { label: string; class: string }> = {
    scheduled: { label: '예정', class: 'bg-blue-50 text-blue-600 border-blue-200' },
    completed: { label: '완료', class: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    cancelled: { label: '취소', class: 'bg-rose-50 text-rose-600 border-rose-200' },
    carried_over: { label: '이월', class: 'bg-purple-50 text-purple-600 border-purple-200' },
};

export function MobileScheduleView({ events, onEventClick, onDateClick, isDark, canEdit }: MobileScheduleViewProps) {
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<string>(
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    );

    // 월 이동
    const goToPrevMonth = () => {
        if (currentMonth === 0) { setCurrentYear(y => y - 1); setCurrentMonth(11); }
        else setCurrentMonth(m => m - 1);
    };
    const goToNextMonth = () => {
        if (currentMonth === 11) { setCurrentYear(y => y + 1); setCurrentMonth(0); }
        else setCurrentMonth(m => m + 1);
    };
    const goToToday = () => {
        setCurrentYear(today.getFullYear());
        setCurrentMonth(today.getMonth());
        setSelectedDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
    };

    // 캘린더 그리드 계산
    const calendarDays = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startDow = firstDay.getDay();
        const totalDays = lastDay.getDate();

        const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

        // 이전 달 빈 칸
        const prevMonthLast = new Date(currentYear, currentMonth, 0).getDate();
        for (let i = startDow - 1; i >= 0; i--) {
            const d = prevMonthLast - i;
            const m = currentMonth === 0 ? 12 : currentMonth;
            const y = currentMonth === 0 ? currentYear - 1 : currentYear;
            days.push({
                date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
                day: d,
                isCurrentMonth: false,
                isToday: false
            });
        }

        // 이번 달
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        for (let d = 1; d <= totalDays; d++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({
                date: dateStr,
                day: d,
                isCurrentMonth: true,
                isToday: dateStr === todayStr
            });
        }

        // 다음 달 빈 칸 (6줄 채우기)
        const remaining = 42 - days.length;
        for (let d = 1; d <= remaining; d++) {
            const m = currentMonth === 11 ? 1 : currentMonth + 2;
            const y = currentMonth === 11 ? currentYear + 1 : currentYear;
            days.push({
                date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
                day: d,
                isCurrentMonth: false,
                isToday: false
            });
        }

        return days;
    }, [currentYear, currentMonth]);

    // 날짜별 이벤트 인덱스
    const eventsByDate = useMemo(() => {
        const map: Record<string, MobileEvent[]> = {};
        events.forEach(ev => {
            const dateStr = ev.extendedProps?.date || (ev.start ? ev.start.split('T')[0] : '');
            if (dateStr) {
                if (!map[dateStr]) map[dateStr] = [];
                map[dateStr].push(ev);
            }
        });
        // 시간순 정렬
        Object.values(map).forEach(list => {
            list.sort((a, b) => (a.extendedProps.start_time || '').localeCompare(b.extendedProps.start_time || ''));
        });
        return map;
    }, [events]);

    // 선택된 날짜의 이벤트
    const selectedEvents = eventsByDate[selectedDate] || [];

    // 선택된 날짜 정보
    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const selectedDayName = DAY_NAMES[selectedDateObj.getDay()];

    const formatTime = (isoStr: string) => {
        try {
            const d = new Date(isoStr);
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        } catch { return '--:--'; }
    };

    return (
        <div className={cn("flex flex-col h-full", isDark && "bg-slate-950")}>
            {/* 월 헤더 */}
            <div className={cn(
                "flex items-center justify-between px-5 py-4",
                isDark ? "bg-slate-900" : "bg-white"
            )}>
                <button onClick={goToPrevMonth} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all">
                    <ChevronLeft className="w-5 h-5 text-slate-500" />
                </button>
                <div className="flex items-center gap-3">
                    <h2 className={cn("text-lg font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                        {currentYear}년 {currentMonth + 1}월
                    </h2>
                    <button
                        onClick={goToToday}
                        className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition-all"
                    >
                        오늘
                    </button>
                </div>
                <button onClick={goToNextMonth} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all">
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                </button>
            </div>

            {/* 요일 헤더 */}
            <div className={cn(
                "grid grid-cols-7 px-2",
                isDark ? "bg-slate-900" : "bg-white"
            )}>
                {DAY_NAMES.map((day, i) => (
                    <div key={day} className={cn(
                        "text-center text-[11px] font-black py-2 tracking-wider",
                        i === 0 ? "text-rose-400" : i === 6 ? "text-blue-400" : isDark ? "text-slate-500" : "text-slate-400"
                    )}>
                        {day}
                    </div>
                ))}
            </div>

            {/* 캘린더 그리드 */}
            <div className={cn(
                "grid grid-cols-7 px-2 pb-2",
                isDark ? "bg-slate-900" : "bg-white"
            )}>
                {calendarDays.map((d, i) => {
                    const dayEvents = eventsByDate[d.date] || [];
                    const isSelected = d.date === selectedDate;
                    const isSunday = i % 7 === 0;
                    const isSaturday = i % 7 === 6;

                    // 색상별 도트 (최대 4개)
                    const dotColors = [...new Set(dayEvents.map(e => e.extendedProps.color))].slice(0, 4);

                    return (
                        <button
                            key={d.date}
                            onClick={() => setSelectedDate(d.date)}
                            className={cn(
                                "relative flex flex-col items-center py-2 rounded-xl transition-all active:scale-95",
                                isSelected && (isDark ? "bg-indigo-600/20" : "bg-indigo-50"),
                                isSelected && "ring-2 ring-indigo-400/30",
                                !isSelected && !d.isToday && "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            )}
                        >
                            <span className={cn(
                                "text-[13px] font-bold w-7 h-7 flex items-center justify-center rounded-full",
                                d.isToday && "bg-indigo-600 text-white font-black",
                                !d.isToday && d.isCurrentMonth && (isDark ? "text-slate-200" : "text-slate-800"),
                                !d.isToday && !d.isCurrentMonth && (isDark ? "text-slate-600" : "text-slate-300"),
                                !d.isToday && isSunday && d.isCurrentMonth && "text-rose-500",
                                !d.isToday && isSaturday && d.isCurrentMonth && "text-blue-500"
                            )}>
                                {d.day}
                            </span>
                            {/* 이벤트 도트 */}
                            <div className="flex items-center gap-[3px] mt-0.5 h-[6px]">
                                {dotColors.map((c, ci) => (
                                    <div
                                        key={ci}
                                        className="w-[5px] h-[5px] rounded-full"
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                                {dayEvents.length > 4 && (
                                    <span className="text-[8px] font-bold text-slate-400">+</span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* 선택된 날짜 헤더 */}
            <div className={cn(
                "px-5 py-3 flex items-center justify-between",
                isDark ? "bg-indigo-900/40 border-t border-slate-800" : "bg-indigo-50 border-t border-indigo-100"
            )}>
                <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-black", isDark ? "text-indigo-300" : "text-indigo-700")}>
                        {selectedDate.replace(/-/g, '.')} ({selectedDayName})
                    </span>
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-lg", isDark ? "bg-indigo-800 text-indigo-300" : "bg-indigo-100 text-indigo-600")}>
                        {selectedEvents.length}건
                    </span>
                </div>
                {canEdit && onDateClick && (
                    <button
                        onClick={() => onDateClick(selectedDateObj)}
                        className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 active:scale-95 transition-all"
                    >
                        + 일정 추가
                    </button>
                )}
            </div>

            {/* 이벤트 목록 */}
            <div className={cn(
                "flex-1 overflow-y-auto px-4 py-3 space-y-2",
                isDark ? "bg-slate-950" : "bg-slate-50"
            )}>
                {selectedEvents.length > 0 ? (
                    selectedEvents.map(ev => {
                        const st = STATUS_MAP[ev.extendedProps.status] || STATUS_MAP.scheduled;
                        const isCancelled = ev.extendedProps.status === 'cancelled';

                        return (
                            <button
                                key={ev.id}
                                onClick={() => onEventClick(ev.id, ev.extendedProps)}
                                className={cn(
                                    "w-full text-left rounded-2xl border p-4 flex items-start gap-3 transition-all active:scale-[0.98]",
                                    isDark ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-slate-100 hover:border-slate-200 shadow-sm",
                                    isCancelled && "opacity-50"
                                )}
                            >
                                {/* 치료사 컬러 바 */}
                                <div
                                    className="w-1 self-stretch rounded-full shrink-0"
                                    style={{ backgroundColor: ev.extendedProps.color }}
                                />

                                {/* 시간 */}
                                <div className="flex flex-col items-center shrink-0 w-14 pt-0.5">
                                    <span className={cn("text-sm font-black", isDark ? "text-slate-200" : "text-slate-800")}>
                                        {formatTime(ev.extendedProps.start_time)}
                                    </span>
                                    <span className={cn("text-[10px] font-bold", isDark ? "text-slate-500" : "text-slate-400")}>
                                        {formatTime(ev.extendedProps.end_time)}
                                    </span>
                                </div>

                                {/* 정보 */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-sm font-black truncate",
                                            isCancelled && "line-through",
                                            isDark ? "text-white" : "text-slate-900"
                                        )}>
                                            {isCancelled ? '[취소] ' : ''}{ev.extendedProps.childName}
                                        </span>
                                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0", st.class)}>
                                            {st.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className={cn("text-[11px] font-bold flex items-center gap-1", isDark ? "text-slate-400" : "text-slate-500")}>
                                            <User className="w-3 h-3" />
                                            {ev.extendedProps.therapistName}
                                        </span>
                                        <span className={cn("text-[11px] font-medium truncate", isDark ? "text-slate-500" : "text-slate-400")}>
                                            {ev.extendedProps.programName}
                                        </span>
                                    </div>
                                    {ev.extendedProps.notes && (
                                        <p className={cn(
                                            "text-[11px] mt-1.5 px-2 py-1 rounded-lg line-clamp-2",
                                            isDark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500"
                                        )}>
                                            {ev.extendedProps.notes}
                                        </p>
                                    )}
                                </div>
                            </button>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <CalendarClock className={cn("w-10 h-10 mb-3", isDark ? "text-slate-700" : "text-slate-200")} />
                        <p className={cn("text-sm font-bold", isDark ? "text-slate-600" : "text-slate-400")}>
                            등록된 일정이 없습니다
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * 📱 ParentMobileCalendar — 부모님 앱 모바일 캘린더
 * 상단: 콤팩트 월간 캘린더 (7열 그리드 + 이벤트 도트)
 * 하단: 선택한 날짜의 수업 목록
 */
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParentCalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    extendedProps: {
        therapistColor: string;
        therapistName: string | null | undefined;
        status: string | null | undefined;
    };
}

interface ParentMobileCalendarProps {
    events: ParentCalendarEvent[];
    childName: string;
    isDark: boolean;
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

export function ParentMobileCalendar({ events, childName, isDark }: ParentMobileCalendarProps) {
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const [selectedDate, setSelectedDate] = useState(todayStr);

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
        setSelectedDate(todayStr);
    };

    // 캘린더 그리드
    const calendarDays = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startDow = firstDay.getDay();
        const totalDays = lastDay.getDate();
        const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

        const prevMonthLast = new Date(currentYear, currentMonth, 0).getDate();
        for (let i = startDow - 1; i >= 0; i--) {
            const d = prevMonthLast - i;
            const m = currentMonth === 0 ? 12 : currentMonth;
            const y = currentMonth === 0 ? currentYear - 1 : currentYear;
            days.push({ date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: false, isToday: false });
        }

        for (let d = 1; d <= totalDays; d++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({ date: dateStr, day: d, isCurrentMonth: true, isToday: dateStr === todayStr });
        }

        const remaining = 42 - days.length;
        for (let d = 1; d <= remaining; d++) {
            const m = currentMonth === 11 ? 1 : currentMonth + 2;
            const y = currentMonth === 11 ? currentYear + 1 : currentYear;
            days.push({ date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: false, isToday: false });
        }

        return days;
    }, [currentYear, currentMonth]);

    // 날짜별 이벤트 인덱스
    const eventsByDate = useMemo(() => {
        const map: Record<string, ParentCalendarEvent[]> = {};
        events.forEach(ev => {
            const dateStr = ev.start ? ev.start.split('T')[0] : '';
            if (dateStr) {
                if (!map[dateStr]) map[dateStr] = [];
                map[dateStr].push(ev);
            }
        });
        Object.values(map).forEach(list => list.sort((a, b) => a.start.localeCompare(b.start)));
        return map;
    }, [events]);

    const selectedEvents = eventsByDate[selectedDate] || [];
    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const selectedDayName = DAY_NAMES[selectedDateObj.getDay()];

    const formatTime = (isoStr: string) => {
        try {
            const d = new Date(isoStr);
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        } catch { return '--:--'; }
    };

    const getStatusInfo = (status: string | null | undefined) => {
        switch (status) {
            case 'completed': return { label: '완료', class: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
            case 'cancelled': return { label: '취소', class: 'bg-rose-50 text-rose-500 border-rose-200' };
            case 'carried_over': return { label: '이월', class: 'bg-purple-50 text-purple-600 border-purple-200' };
            default: return { label: '예정', class: 'bg-blue-50 text-blue-600 border-blue-200' };
        }
    };

    return (
        <div>
            {/* 월 헤더 */}
            <div className="flex items-center justify-between px-1 mb-3">
                <button onClick={goToPrevMonth} className={cn("p-2 rounded-xl active:scale-90 transition-all", isDark ? "hover:bg-slate-800" : "hover:bg-slate-100")}>
                    <ChevronLeft className="w-5 h-5 text-slate-400" />
                </button>
                <div className="flex items-center gap-2">
                    <span className={cn("text-base font-black", isDark ? "text-white" : "text-slate-900")}>
                        {currentYear}년 {currentMonth + 1}월
                    </span>
                    <button
                        onClick={goToToday}
                        className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md"
                    >
                        오늘
                    </button>
                </div>
                <button onClick={goToNextMonth} className={cn("p-2 rounded-xl active:scale-90 transition-all", isDark ? "hover:bg-slate-800" : "hover:bg-slate-100")}>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map((day, i) => (
                    <div key={day} className={cn(
                        "text-center text-[11px] font-black py-1.5",
                        i === 0 ? "text-rose-400" : i === 6 ? "text-blue-400" : isDark ? "text-slate-500" : "text-slate-400"
                    )}>
                        {day}
                    </div>
                ))}
            </div>

            {/* 캘린더 그리드 */}
            <div className="grid grid-cols-7 mb-4">
                {calendarDays.map((d, i) => {
                    const dayEvents = eventsByDate[d.date] || [];
                    const isSelected = d.date === selectedDate;
                    const isSunday = i % 7 === 0;
                    const isSaturday = i % 7 === 6;

                    const dotColors = [...new Set(dayEvents.map(e => e.extendedProps.therapistColor))].slice(0, 3);

                    return (
                        <button
                            key={d.date}
                            onClick={() => setSelectedDate(d.date)}
                            className={cn(
                                "relative flex flex-col items-center py-1.5 rounded-xl transition-all active:scale-95",
                                isSelected && (isDark ? "bg-indigo-600/20 ring-2 ring-indigo-400/30" : "bg-indigo-50 ring-2 ring-indigo-300/30")
                            )}
                        >
                            <span className={cn(
                                "text-[13px] font-bold w-7 h-7 flex items-center justify-center rounded-full",
                                d.isToday && "bg-indigo-600 text-white font-black",
                                !d.isToday && d.isCurrentMonth && (isDark ? "text-slate-200" : "text-slate-700"),
                                !d.isToday && !d.isCurrentMonth && (isDark ? "text-slate-600" : "text-slate-300"),
                                !d.isToday && isSunday && d.isCurrentMonth && "text-rose-500",
                                !d.isToday && isSaturday && d.isCurrentMonth && "text-blue-500"
                            )}>
                                {d.day}
                            </span>
                            <div className="flex items-center gap-[3px] mt-0.5 h-[6px]">
                                {dotColors.map((c, ci) => (
                                    <div key={ci} className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: c }} />
                                ))}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* 선택된 날짜 헤더 */}
            <div className={cn(
                "px-4 py-2.5 rounded-2xl mb-3 flex items-center justify-between",
                isDark ? "bg-indigo-900/30 border border-indigo-800" : "bg-indigo-50 border border-indigo-100"
            )}>
                <span className={cn("text-sm font-black", isDark ? "text-indigo-300" : "text-indigo-700")}>
                    {selectedDate.replace(/-/g, '.')} ({selectedDayName})
                </span>
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-lg", isDark ? "bg-indigo-800 text-indigo-300" : "bg-indigo-100 text-indigo-600")}>
                    {selectedEvents.length}건
                </span>
            </div>

            {/* 이벤트 목록 */}
            <div className="space-y-2">
                {selectedEvents.length > 0 ? (
                    selectedEvents.map(ev => {
                        const st = getStatusInfo(ev.extendedProps.status);
                        const isCancelled = ev.extendedProps.status === 'cancelled';

                        return (
                            <div
                                key={ev.id}
                                className={cn(
                                    "rounded-2xl border p-4 flex items-start gap-3",
                                    isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100 shadow-sm",
                                    isCancelled && "opacity-50"
                                )}
                            >
                                <div
                                    className="w-1 self-stretch rounded-full shrink-0"
                                    style={{ backgroundColor: ev.extendedProps.therapistColor }}
                                />
                                <div className="flex flex-col shrink-0 w-12 pt-0.5">
                                    <span className={cn("text-sm font-black", isDark ? "text-slate-200" : "text-slate-800")}>
                                        {formatTime(ev.start)}
                                    </span>
                                    <span className={cn("text-[10px] font-bold", isDark ? "text-slate-500" : "text-slate-400")}>
                                        {formatTime(ev.end)}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-sm font-black truncate",
                                            isCancelled && "line-through",
                                            isDark ? "text-white" : "text-slate-900"
                                        )}>
                                            {childName}
                                        </span>
                                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0", st.class)}>
                                            {st.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {ev.extendedProps.therapistName && (
                                            <span className={cn("text-[11px] font-bold", isDark ? "text-slate-400" : "text-slate-500")}>
                                                {ev.extendedProps.therapistName}
                                            </span>
                                        )}
                                        <span className={cn("text-[11px] font-medium truncate", isDark ? "text-slate-500" : "text-slate-400")}>
                                            {ev.title}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <CalendarClock className={cn("w-8 h-8 mb-2", isDark ? "text-slate-700" : "text-slate-200")} />
                        <p className={cn("text-sm font-bold", isDark ? "text-slate-600" : "text-slate-400")}>
                            이 날은 수업이 없습니다
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

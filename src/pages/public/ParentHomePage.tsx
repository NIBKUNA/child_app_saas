// @ts-nocheck
/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
    Home, Sparkles, User, Calendar as CalendarIcon,
    MessageSquare, ChevronLeft, ChevronRight, Activity, Info, Quote
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// 캘린더 라이브러리 (리스트 플러그인 제외됨)
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';

export function ParentHomePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const dateInputRef = useRef(null);

    // 상태 관리
    const [childInfo, setChildInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    const [calendarEvents, setCalendarEvents] = useState([]);
    const [allLogs, setAllLogs] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [filterDate, setFilterDate] = useState('');

    useEffect(() => {
        if (user?.id) fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const { data: child } = await supabase.from('children').select('*').eq('parent_id', user.id).maybeSingle();

            if (child) {
                setChildInfo(child);

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
                }

                // 상담 일지 가져오기
                const { data: logs } = await supabase
                    .from('consultations')
                    .select(`*, therapists:therapist_id (name)`)
                    .eq('child_id', child.id)
                    .order('created_at', { ascending: false });
                setAllLogs(logs || []);
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

    if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">데이터를 불러오는 중입니다...</div>;

    return (
        <div className="min-h-screen bg-[#FDFCFB] font-sans pb-20 text-[#1e293b]">
            <Helmet><title>우리 아이 성장 대시보드</title></Helmet>

            <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl px-6 py-4 flex justify-between items-center border-b border-slate-100 shadow-sm">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-900 font-bold text-xs"><Home className="w-4 h-4" /> 홈으로</button>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase italic">Parent Mode</div>
            </nav>

            <header className="px-8 pt-12 pb-10 bg-white border-b border-orange-50/50">
                <div className="max-w-4xl mx-auto space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-[11px] font-black uppercase"><Sparkles className="w-3 h-3" /> Happiness Center</div>
                    <h1 className="text-3xl font-black leading-tight text-slate-900">
                        <span className="text-primary">{childInfo?.name}</span> 보호자님,<br />반가워요! 👋
                    </h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-12">

                {/* 1. 수업 일정 캘린더 (리스트 뷰 제거됨) */}
                <section>
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-black text-slate-900">수업 일정표</h2>
                    </div>
                    <div className="bg-white rounded-[32px] p-4 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <style>{`
                            .fc-toolbar-title { font-size: 1.1rem !important; font-weight: 800 !important; color: #1e293b; }
                            .fc-button { background-color: #ffffff !important; border: 1px solid #e2e8f0 !important; color: #64748b !important; font-weight: bold !important; box-shadow: none !important; font-size: 0.8rem !important; }
                            .fc-button-active { background-color: #f1f5f9 !important; color: #0f172a !important; }
                            .fc-event { border-radius: 6px !important; padding: 2px 4px !important; font-size: 0.8rem !important; font-weight: 700 !important; border: none !important; }
                            .fc-day-today { background-color: #fff7ed !important; }
                        `}</style>
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            locale={koLocale}
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth'
                            }}
                            buttonText={{ today: '오늘', month: '달력' }}
                            events={calendarEvents}
                            height="auto"
                            contentHeight="auto"
                            aspectRatio={1.5}
                            editable={false}
                            selectable={false}
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
                                            <div className="space-y-4">
                                                {Object.entries(allLogs[currentIndex].domain_scores).map(([label, score]) => (
                                                    <div key={label} className="space-y-2">
                                                        <div className="flex justify-between items-center text-[11px] font-black">
                                                            <span className="text-slate-500">{label}</span>
                                                            <span className="text-primary bg-primary/5 px-2.5 py-1 rounded-lg font-black">{score}점</span>
                                                        </div>
                                                        <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100/50 shadow-inner">
                                                            <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: `${score}%` }}></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="bg-orange-50/50 p-5 rounded-[24px] flex items-start gap-3 border border-orange-100/50 shadow-sm">
                                                <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                                                <p className="text-[11px] text-orange-800/80 font-black leading-snug">본 그래프는 아이의 발달 상태를 이해하기 위한 참고용 데이터입니다.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-8 px-4">
                                <button onClick={prevSlide} disabled={currentIndex === 0} className="w-14 h-14 rounded-full flex items-center justify-center transition-all bg-white text-slate-900 shadow-xl active:scale-90 border border-slate-100 disabled:opacity-20 disabled:shadow-none"><ChevronLeft className="w-6 h-6" /></button>
                                <div className="flex gap-2">
                                    {allLogs.slice(0, 5).map((_, idx) => (<div key={idx} className={`h-1.5 rounded-full transition-all ${currentIndex === idx ? 'w-8 bg-primary' : 'w-1.5 bg-slate-200'}`}></div>))}
                                </div>
                                <button onClick={nextSlide} disabled={currentIndex === allLogs.length - 1} className="w-14 h-14 rounded-full flex items-center justify-center transition-all bg-white text-slate-900 shadow-xl active:scale-90 border border-slate-100 disabled:opacity-20 disabled:shadow-none"><ChevronRight className="w-6 h-6" /></button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm">
                            <p className="text-slate-400 font-bold text-sm italic">등록된 성장 리포트가 없습니다.</p>
                        </div>
                    )}
                </section>

                <section className="bg-orange-50 rounded-[48px] p-10 text-center border border-orange-100/50 relative overflow-hidden shadow-sm">
                    <Quote className="absolute -left-4 -top-4 w-24 h-24 text-orange-200/30" />
                    <p className="relative z-10 text-orange-800 font-black text-[15px] leading-relaxed italic tracking-tight">"조금 천천히 가도 괜찮아요.<br />아이만의 속도를 믿어주는 부모님은<br />아이의 가장 큰 우주입니다."</p>
                </section>
            </main>
        </div>
    );
}
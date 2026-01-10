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

// 캘린더 라이브러리
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';

import { ConsultationSurveyModal } from '@/components/public/ConsultationSurveyModal';
import { InvitationCodeModal } from '@/components/InvitationCodeModal';

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

    useEffect(() => {
        if (user?.id) fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        // ... (existing code omitted for brevity but presumed same)
        // Note: For replace_file_content, I must include enough context if I am replacing a big block, 
        // but here I am just injecting imports and state. 
        // Wait, I can't easily partially inject state inside the function without replacing the function body start.
        // So I will replace the start of the component to include state and import.

        // Actually, to make this clean, I will replace the top imports and the component start.
        setLoading(true);
        try {
            // ✨ [자녀 연결 감지] children + family_relationships 체크
            let child = null;

            // 1. children.parent_id로 직접 연결된 자녀 체크
            const { data: directChild } = await supabase
                .from('children')
                .select('*')
                .eq('parent_id', user.id)
                .maybeSingle();

            if (directChild) {
                child = directChild;
            } else {
                // 2. family_relationships 테이블에서 체크
                const { data: relationship } = await supabase
                    .from('family_relationships')
                    .select('child_id')
                    .eq('parent_id', user.id)
                    .maybeSingle();

                if (relationship?.child_id) {
                    const { data: relatedChild } = await supabase
                        .from('children')
                        .select('*')
                        .eq('id', relationship.child_id)
                        .single();
                    child = relatedChild;
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
                const { data: logs } = await supabase
                    .from('consultations')
                    .select(`*, therapists:therapist_id (name)`)
                    .eq('child_id', child.id)
                    .order('created_at', { ascending: false });
                setAllLogs(logs || []);
            } else {
                // ✨ [초대 코드 모달] 연결된 자녀가 없으면 모달 표시
                setShowInvitationModal(true);
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

    if (loading) return <div className={cn("min-h-screen flex items-center justify-center font-bold", isDark ? "bg-slate-950 text-slate-400" : "text-slate-500")}>데이터를 불러오는 중입니다...</div>;

    const kakaoUrl = getSetting('kakao_url');

    return (
        <div className={cn("min-h-screen font-sans pb-20 transition-colors", isDark ? "bg-slate-950 text-slate-100" : "bg-[#FDFCFB] text-[#1e293b]")}>
            <Helmet><title>우리 아이 성장 대시보드</title></Helmet>

            <ConsultationSurveyModal
                isOpen={isSurveyOpen}
                onClose={() => setIsSurveyOpen(false)}
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
                        "rounded-[32px] p-4 md:p-8 shadow-lg border overflow-hidden",
                        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-slate-200/50"
                    )}>
                        <style>{`
                            ${isDark ? `
                            .fc { --fc-border-color: #334155; --fc-page-bg-color: #0f172a; }
                            .fc-theme-standard td, .fc-theme-standard th { border-color: #334155 !important; }
                            .fc-scrollgrid { border-color: #334155 !important; }
                            .fc-col-header-cell-cushion, .fc-daygrid-day-number { color: #e2e8f0 !important; }
                            .fc-day-today { background-color: #1e293b !important; }
                            .fc-event { color: #ffffff !important; }
                            .fc-event-title { color: #ffffff !important; font-weight: 700; }
                            .fc-button { background-color: #1e293b !important; border-color: #334155 !important; color: #e2e8f0 !important; }
                            .fc-button-active { background-color: #334155 !important; }
                            .fc-toolbar-title { color: #f1f5f9 !important; }
                            ` : `
                            .fc-toolbar-title { font-size: 1.1rem !important; font-weight: 800 !important; color: #1e293b; }
                            .fc-button { background-color: #ffffff !important; border: 1px solid #e2e8f0 !important; color: #64748b !important; font-weight: bold !important; box-shadow: none !important; font-size: 0.8rem !important; }
                            .fc-button-active { background-color: #f1f5f9 !important; color: #0f172a !important; }
                            .fc-event { border-radius: 6px !important; padding: 2px 4px !important; font-size: 0.8rem !important; font-weight: 700 !important; border: none !important; }
                            .fc-day-today { background-color: #fff7ed !important; }
                            `}
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
                                                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                                                style={{
                                                                    width: `${score}%`,
                                                                    background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)'
                                                                }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                ))}
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
                        <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm">
                            <p className="text-slate-400 font-bold text-sm italic">등록된 성장 리포트가 없습니다.</p>
                        </div>
                    )}
                </section>

                {/* Quote Section */}
                <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[48px] p-10 text-center border border-orange-100/30 relative overflow-hidden shadow-sm">
                    <Quote className="absolute -left-4 -top-4 w-24 h-24 text-orange-200/30" />
                    <p className="relative z-10 text-orange-800 font-black text-[15px] leading-relaxed italic tracking-tight" style={{ wordBreak: 'keep-all' }}>
                        "조금 천천히 가도 괜찮아요.<br />아이만의 속도를 믿어주는 부모님은<br />아이의 가장 큰 우주입니다."
                    </p>
                </section>

                {/* Home Care Tips Section */}
                <section className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-100/50 border border-slate-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-lg">🏠</div>
                        <h3 className="text-lg font-black text-slate-900">오늘의 홈 케어 팁</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                            <p className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-2">언어 발달</p>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed" style={{ wordBreak: 'keep-all' }}>
                                하루 10분, 아이와 눈을 맞추며 그림책을 함께 읽어보세요.
                                질문을 던지고 기다려주는 것이 핵심입니다.
                            </p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                            <p className="text-xs font-black text-rose-600 uppercase tracking-wider mb-2">정서 안정</p>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed" style={{ wordBreak: 'keep-all' }}>
                                자기 전 5분간 오늘 있었던 일을 얘기해보세요.
                                "어떤 기분이었어?"라고 물어봐 주세요.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
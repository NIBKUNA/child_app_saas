import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Home, Sparkles, MessageSquare, Calendar as CalendarIcon, Info
} from 'lucide-react';

import { MessageCircle } from 'lucide-react';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';

import type { Database } from '@/types/database.types';

type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];



// 📊 Recharts for Horizontal Bar Chart

// 캘린더 라이브러리
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';

import { ConsultationSurveyModal } from '@/components/public/ConsultationSurveyModal';
import { InvitationCodeModal } from '@/components/InvitationCodeModal';
import { Skeleton } from '@/components/common/Skeleton';
import { useCenter } from '@/contexts/CenterContext';
import { centerPath } from '@/config/domain';


interface ChildInfo extends TableRow<'children'> { }




interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    extendedProps: {
        therapistColor: string;
        therapistName: string | null | undefined;
        status: string | null | undefined;
    };
}


export function ParentHomePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getSetting } = useAdminSettings();
    const { theme } = useTheme();
    const { center } = useCenter();
    const isDark = theme === 'dark';




    // 상태 관리
    const [childInfo, setChildInfo] = useState<ChildInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSurveyOpen, setIsSurveyOpen] = useState(false);

    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

    const [hasUpcomingConsultation, setHasUpcomingConsultation] = useState(false);
    const [showInvitationModal, setShowInvitationModal] = useState(false);
    // ✨ 관찰 일기 상태
    const [observationText, setObservationText] = useState('');
    const [savingObs, setSavingObs] = useState(false);



    useEffect(() => {
        if (user?.id) fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // ✨ [자녀 연결 감지] children + family_relationships 체크
            let child = null;

            if (!user?.id) return;

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
                    .select('child_id, children:child_id(*)')
                    .eq('parent_id', user?.id)
                    .maybeSingle();

                if (relationship) {
                    const childData = (relationship as { children: ChildInfo | null }).children;
                    if (childData) {
                        child = childData;
                    }
                }
            }




            if (child) {
                setChildInfo(child);
                setShowInvitationModal(false);

                // 일정 데이터 가져오기
                const { data: schedules } = await supabase
                    .from('schedules')
                    .select(`
                        id, start_time, end_time, status, title,
                        therapists (name, color)
                    `)
                    .eq('child_id', child.id)
                    .order('start_time', { ascending: true });

                if (schedules) {
                    const events: CalendarEvent[] = schedules.map(s => {
                        const therapist = s.therapists as unknown as { name: string | null; color: string | null } | null;
                        return {
                            id: s.id,
                            title: s.title || '수업',
                            start: s.start_time,
                            end: s.end_time,
                            backgroundColor: 'transparent',
                            borderColor: 'transparent',
                            textColor: '#1e293b',
                            extendedProps: {
                                therapistColor: therapist?.color || '#3b82f6',
                                therapistName: therapist?.name,
                                status: s.status
                            }
                        };
                    });
                    setCalendarEvents(events);

                    // ✨ 다가오는 상담/평가 일정 확인
                    const today = new Date().toISOString();
                    const nextConsult = schedules.find(s =>
                        s.start_time > today &&
                        (s.title?.includes('상담') || s.title?.includes('평가'))
                    );
                    if (nextConsult) setHasUpcomingConsultation(true);
                }



            } else {
                // ✨ [초대 코드 모달] 연결된 자녀가 없고 '부모' 권한일 때만 모달 표시
                const isParent = user?.user_metadata?.role === 'parent' || user?.role === 'parent';
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





    // ✨ 관찰 일기 저장 핸들러
    const handleSaveObservation = async () => {
        if (!observationText.trim() || !childInfo?.id || !user?.id) return;
        setSavingObs(true);
        try {
            const payload = {
                parent_id: user.id,
                child_id: childInfo.id,
                content: observationText.trim(),
                observation_date: new Date().toISOString().split('T')[0]
            };
            const { error } = await supabase.from('parent_observations').insert(payload as never);
            if (error) throw error;
            alert('관찰 일기가 저장되었습니다! 🌟');
            setObservationText('');
        } catch (e: any) {
            alert('저장 실패: ' + e.message);
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
                centerId={childInfo?.center_id || ''} // ✨ Pass centerId from childInfo
                initialData={{
                    childName: childInfo?.name || '',
                    childBirthDate: childInfo?.birth_date || '',
                    childGender: (childInfo?.gender as 'male' | 'female' | 'other') || 'other',
                    childId: childInfo?.id || '',
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
                parentId={user?.id || ''}
            />


            <nav className={cn(
                "sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b shadow-sm",
                isDark ? "bg-slate-900/90 border-slate-800" : "bg-white/90 backdrop-blur-sm border-slate-100"
            )}>
                <button
                    onClick={() => navigate(centerPath(center?.slug))}
                    className={cn("flex items-center gap-2 font-bold text-xs", isDark ? "text-slate-300" : "text-slate-900")}
                >
                    <Home className="w-4 h-4" /> 홈으로
                </button>
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

                            {/* ✨ Mobile Only: Consultation Button */}
                            <button
                                onClick={() => setIsSurveyOpen(true)}
                                className="md:hidden mt-4 w-full bg-white text-indigo-700 px-6 py-3.5 rounded-2xl font-black text-sm shadow-lg hover:bg-indigo-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <MessageSquare className="w-4 h-4" /> 상담 신청하기
                            </button>
                        </div>

                        {/* Desktop Button */}
                        <button
                            onClick={() => setIsSurveyOpen(true)}
                            className="hidden md:flex bg-white text-indigo-700 px-6 py-3 rounded-2xl font-black text-sm shadow-lg hover:bg-indigo-50 active:scale-95 transition-all items-center gap-2 ring-2 ring-white/20"
                        >
                            <MessageSquare className="w-4 h-4" /> 상담 신청
                        </button>
                    </div>
                </div>
            </header>

            {/* Mood Check Banner & Observation */}
            <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-20 space-y-4">
                <div className={cn(
                    "rounded-[28px] p-6 shadow-lg border flex flex-col md:flex-row items-center justify-between gap-6",
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-indigo-100/30"
                )}>
                    <div className="flex items-center gap-4 flex-1">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0", isDark ? "bg-amber-900/30" : "bg-amber-50")}>☀️</div>
                        <div>
                            <p className={cn("text-sm font-black", isDark ? "text-white" : "text-slate-800")} style={{ wordBreak: 'keep-all' }}>
                                오늘 {childInfo?.name}의 컨디션은 어떤가요?
                            </p>
                            <p className={cn("text-xs font-medium", isDark ? "text-slate-500" : "text-slate-400")}>가정에서의 관찰 일기를 남겨주세요</p>
                        </div>
                    </div>
                    <div className="w-full md:w-auto flex flex-col gap-3">
                        <div className="flex gap-2 justify-center">
                            {['😊', '😐', '😢'].map((emoji, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setObservationText(prev => prev + emoji)}
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

                <div className={cn(
                    "rounded-[28px] p-6 shadow-lg border space-y-4",
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-indigo-100/30"
                )}>
                    <textarea
                        value={observationText}
                        onChange={(e) => setObservationText(e.target.value)}
                        placeholder="오늘 우리 아이는 어땠나요? 선생님께 전달할 관찰 내용을 적어보세요..."
                        className={cn(
                            "w-full h-24 p-4 rounded-2xl text-sm border focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none",
                            isDark ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" : "bg-slate-50 border-slate-100 text-slate-800 placeholder:text-slate-400"
                        )}
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveObservation}
                            disabled={savingObs || !observationText.trim()}
                            className={cn(
                                "px-6 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 shadow-md",
                                savingObs ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-primary text-white hover:bg-primary/90 active:scale-95"
                            )}
                        >
                            {savingObs ? '저장 중...' : '기록 저장하기'}
                        </button>
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
                            dayMaxEvents={3}
                            eventDisplay="block"
                            moreLinkClick="popover"
                            editable={false}
                            selectable={false}
                            eventContent={(eventInfo) => {
                                const { therapistColor, status } = eventInfo.event.extendedProps;

                                // ✨ 상태별 스타일링 정의
                                let containerClass = "flex flex-col py-1.5 px-2 rounded-lg border-l-[3px] shadow-sm mb-1 overflow-hidden transition-all";
                                let bgStyle = {};
                                let titleClass = "text-[11px] font-black leading-tight truncate";
                                let statusBadge = null;

                                if (status === 'cancelled') {
                                    bgStyle = { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }; // Gray
                                    titleClass += " text-slate-400 line-through decoration-slate-400";
                                    statusBadge = <span className="text-[9px] text-rose-500 font-black ml-1">(취소)</span>;
                                } else if (status === 'completed') {
                                    bgStyle = { backgroundColor: `${therapistColor}25`, borderColor: therapistColor }; // Slightly darker pastel
                                    titleClass += " text-slate-700 opacity-80";
                                    statusBadge = <span className="text-[9px] text-indigo-600 font-black ml-1">(완료)</span>;
                                } else {
                                    // Scheduled (Default)
                                    bgStyle = { backgroundColor: `${therapistColor}15`, borderColor: therapistColor };
                                    titleClass += " text-slate-900";
                                }

                                return (
                                    <div
                                        className={containerClass}
                                        style={bgStyle}
                                    >
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className={cn(
                                                "text-[10px] font-black leading-none",
                                                (status === 'cancelled') ? "text-slate-400" : "text-slate-600 opacity-80"
                                            )}>
                                                {childInfo?.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className={titleClass}>
                                                {eventInfo.event.title}
                                            </span>
                                            {statusBadge}
                                        </div>
                                    </div>
                                );
                            }}
                            eventClick={(info) => alert(`${childInfo?.name} 아동\n${info.event.title}\n시간: ${info.event.start?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)}
                        />

                    </div>
                </section>

                {/* [Mod] 홈 화면에서는 일정만 표시하고, 상세 기록은 성장 기록 일지 메뉴에서 확인하도록 수정 */}
                <div className="bg-indigo-50 p-6 shadow-sm rounded-[32px] border border-indigo-100/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Info className="w-5 h-5 text-indigo-500" />
                        <div>
                            <p className="text-sm font-black text-indigo-900">상세 기록 확인하기</p>
                            <p className="text-xs text-indigo-700">작성된 상담 일지와 성장 리포트는 '성장 기록 일지' 메뉴에서 보실 수 있습니다.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
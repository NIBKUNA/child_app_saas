
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
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ExcelExportButton } from '@/components/common/ExcelExportButton';
import type { Database } from '@/types/database.types'; // ✨ Import Types

import { useCenter } from '@/contexts/CenterContext'; // ✨ Import
import {
    Phone, Clock,
    RefreshCcw, Trash2,
    CheckCircle2, XCircle, Hourglass, Save, StickyNote, AlertTriangle
} from 'lucide-react';

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

type ConsultationInquiry = Database['public']['Tables']['consultations']['Row'];

export default function ConsultationInquiryList() {
    const [inquiries, setInquiries] = useState<ConsultationInquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [memoValues, setMemoValues] = useState<{ [key: string]: string }>({}); // 각 문의별 메모 임시 상태
    const [viewMode, setViewMode] = useState<'pending' | 'archived'>('pending'); // ✨ Tab State
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null); // ✨ 삭제 확인 모달
    const { center } = useCenter(); // ✨ Use Center
    const centerId = center?.id;

    // ✨ 문의 접수 시간 포맷팅
    const formatInquiryTime = (dateStr: string | null) => {
        if (!dateStr) return { full: '-', relative: '' };
        const d = new Date(dateStr);
        const full = d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
            + ' ' + d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });

        // 상대 시간 계산
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        let relative = '';
        if (diffMins < 1) relative = '방금 전';
        else if (diffMins < 60) relative = `${diffMins}분 전`;
        else if (diffHours < 24) relative = `${diffHours}시간 전`;
        else if (diffDays < 7) relative = `${diffDays}일 전`;
        else relative = `${Math.floor(diffDays / 7)}주 전`;

        return { full, relative };
    };

    useEffect(() => {
        if (centerId) fetchData();
    }, [centerId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // ✨ [Scalability] 최근 6개월 이내 문의만 조회 — 장기 데이터 누적 대비
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            const rangeStart = sixMonthsAgo.toISOString();

            const { data, error } = await supabase
                .from('consultations')
                .select('*')
                .is('schedule_id', null)
                .eq('center_id', centerId!) // 🔒 [SECURITY] useEffect guard ensures centerId is set
                .gte('created_at', rangeStart)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInquiries(data || []);

            // 초기 메모 값 설정
            const initialMemos: { [key: string]: string } = {};
            data?.forEach((inq: ConsultationInquiry) => {
                initialMemos[inq.id] = inq.notes || ''; // DB의 notes 컬럼 사용
            });
            setMemoValues(initialMemos);
        } catch (e) {
            console.error("Data Load Error:", e);
        } finally {
            setLoading(false);
        }
    };

    // 메모 저장 함수
    const saveMemo = async (id: string) => {
        if (!centerId) return;
        const { error } = await supabase
            .from('consultations')
            .update({ notes: memoValues[id] }) // notes 컬럼에 저장
            .eq('id', id)
            .eq('center_id', centerId); // 🔒 [Security] 센터 격리

        if (!error) {
            alert("메모가 저장되었습니다.");
            fetchData();
        } else {
            alert("저장 실패: " + error.message);
        }
    };

    const updateStatus = async (id: string, nextStatus: string) => {
        if (!centerId) return;
        try {
            const { error } = await supabase
                .from('consultations')
                .update({ status: nextStatus })
                .eq('id', id)
                .eq('center_id', centerId); // 🔒 [Security] 센터 격리

            if (error) throw error;

            // ✨ UI Update & Feedback
            setInquiries(prev => prev.map(item =>
                item.id === id ? { ...item, status: nextStatus } : item
            ));
            alert(`상태가 '${nextStatus === 'pending' ? '대기' : nextStatus === 'completed' ? '완료' : '취소'}'(으)로 변경되었습니다.`);

        } catch (err) {
            console.error("Status Update Failed:", err);
            alert("상태 변경에 실패했습니다. 다시 시도해주세요.");
        }
    };

    // ✨ 삭제 확인 모달 열기
    const deleteInquiry = (id: string) => {
        setDeleteTargetId(id);
    };

    // ✨ 실제 삭제 실행
    const confirmDelete = async () => {
        if (!deleteTargetId || !centerId) return;
        try {
            const { error } = await supabase
                .from('consultations')
                .delete()
                .eq('id', deleteTargetId)
                .eq('center_id', centerId);

            if (error) {
                alert('삭제 실패: ' + error.message);
                return;
            }
            setInquiries(prev => prev.filter(item => item.id !== deleteTargetId));
        } catch (err: any) {
            alert('삭제 오류: ' + (err?.message || '알 수 없는 오류'));
        } finally {
            setDeleteTargetId(null);
        }
    };

    if (loading) return <div className="p-20 text-center font-black text-slate-300 dark:text-slate-500 animate-pulse">상담 정보를 동기화하고 있습니다...</div>;

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-800 p-4 md:p-8 rounded-2xl md:rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-700 gap-3 md:gap-4">
                <div>
                    <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">상담 문의 센터</h1>
                    <p className="text-xs md:text-base text-slate-500 dark:text-slate-400 font-bold mt-1 md:mt-2">비회원 문의부터 상담 기록까지 한 화면에서 관리하세요.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    {/* ✨ [Export] Excel Download Button */}
                    <ExcelExportButton
                        data={inquiries}
                        fileName="상담문의_목록"
                        headers={['child_name', 'child_gender', 'guardian_name', 'guardian_phone', 'preferred_consult_schedule', 'concern', 'status', 'marketing_source', 'inflow_source', 'created_at']}
                        headerLabels={{
                            child_name: '아동명',
                            child_gender: '성별',
                            guardian_name: '보호자명',
                            guardian_phone: '연락처',
                            preferred_consult_schedule: '희망일정',
                            concern: '주호소',
                            status: '상태',
                            marketing_source: '유입경로(UTM)',
                            inflow_source: '유입경로(설문)',
                            created_at: '접수일시'
                        }}
                    />
                    <button onClick={fetchData} className="p-3 md:p-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl md:rounded-2xl transition-all shadow-lg shadow-indigo-100 group shrink-0">
                        <RefreshCcw className="w-4 h-4 md:w-5 md:h-5 text-white group-hover:rotate-180 transition-all duration-500" />
                    </button>
                </div>
            </header>

            {/* ✨ Tab Navigation */}
            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 pb-1 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setViewMode('pending')}
                    className={cn(
                        "pb-4 px-4 text-sm md:text-base font-bold transition-all relative whitespace-nowrap",
                        viewMode === 'pending'
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    )}
                >
                    상담 대기
                    {viewMode === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />}
                </button>
                <button
                    onClick={() => setViewMode('archived')}
                    className={cn(
                        "pb-4 px-4 text-sm md:text-base font-bold transition-all relative whitespace-nowrap",
                        viewMode === 'archived'
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    )}
                >
                    상담 보관함 (완료/취소)
                    {viewMode === 'archived' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 dark:bg-white rounded-t-full" />}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:gap-8">
                {inquiries
                    .filter(inq => {
                        if (viewMode === 'pending') return inq.status === 'pending' || inq.status === 'new' || !inq.status;
                        return inq.status === 'completed' || inq.status === 'canceled';
                    })
                    .length === 0 ? (
                    <div className="p-20 text-center bg-white dark:bg-slate-800 rounded-[40px] border-2 border-dashed border-slate-100 dark:border-slate-700 text-slate-300 dark:text-slate-500 font-black">
                        {viewMode === 'pending' ? '대기 중인 문의가 없습니다.' : '보관된 상담 내역이 없습니다.'}
                    </div>
                ) : inquiries
                    .filter(inq => {
                        if (viewMode === 'pending') return inq.status === 'pending' || inq.status === 'new' || !inq.status;
                        return inq.status === 'completed' || inq.status === 'canceled';
                    })
                    .map((inq) => (
                        <div key={inq.id} className="bg-white dark:bg-slate-800 p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    {inq.child_id ? (
                                        <span className="px-4 py-1.5 rounded-2xl text-[10px] font-black bg-emerald-50 text-emerald-600">정회원</span>
                                    ) : (
                                        <span className="px-4 py-1.5 rounded-2xl text-[10px] font-black bg-amber-50 text-amber-600">신규/비회원</span>
                                    )}
                                    <span className="text-[10px] font-bold text-slate-300">{(() => {
                                        const t = formatInquiryTime(inq.created_at);
                                        return <>{t.full} 접수 <span className="ml-1 text-indigo-400">({t.relative})</span></>;
                                    })()}</span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteInquiry(inq.id);
                                    }}
                                    className="p-3 text-slate-300 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all relative z-10 cursor-pointer"
                                    title="삭제"
                                ><Trash2 className="w-5 h-5" /></button>
                            </div>

                            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-6 md:mb-8">{inq.child_name || '이름 미입력'} 아동 {inq.child_gender && <span className="text-slate-300 dark:text-slate-500 text-lg">({inq.child_gender})</span>}</h3>

                            {/* 부모님 작성 내용 */}
                            <div className="bg-slate-50 dark:bg-slate-700/50 p-5 md:p-8 rounded-[24px] md:rounded-[32px] mb-6 border border-slate-100 dark:border-slate-600">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-sm mb-6 pb-6 border-b border-slate-200/50 dark:border-slate-600">
                                    <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-3"><Phone className="w-5 h-5 text-indigo-400" /> {inq.guardian_phone || '번호 없음'} {inq.guardian_name ? `(${inq.guardian_name})` : ''}</p>
                                    <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-3"><Clock className="w-5 h-5 text-indigo-400" /> {inq.preferred_consult_schedule || '미정'}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[11px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">부모님 고민사항</p>
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{inq.concern || '내용 없음'}</p>
                                </div>
                            </div>

                            {/* [추가] 상담사 메모란 */}
                            <div className="mb-8 p-5 md:p-8 bg-indigo-50/30 dark:bg-indigo-900/20 rounded-[24px] md:rounded-[32px] border border-indigo-100/50 dark:border-indigo-800/50 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                        <StickyNote className="w-4 h-4" />
                                        <span className="text-xs font-black uppercase">상담사 관리 메모</span>
                                    </div>
                                    <button
                                        onClick={() => saveMemo(inq.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold hover:bg-indigo-700 transition-all"
                                    >
                                        <Save className="w-3 h-3" /> 메모 저장
                                    </button>
                                </div>
                                <textarea
                                    value={memoValues[inq.id] || ''}
                                    onChange={(e) => setMemoValues({ ...memoValues, [inq.id]: e.target.value })}
                                    placeholder="상담 진행 내용이나 예약 확정 일자 등을 기록하세요..."
                                    className="w-full h-24 bg-white dark:bg-slate-700 border border-indigo-100 dark:border-slate-600 rounded-2xl p-4 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none placeholder:text-slate-300 dark:placeholder:text-slate-500"
                                />
                            </div>

                            {/* 상태 변경 버튼 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <button onClick={() => updateStatus(inq.id, 'pending')} className={cn("py-4 rounded-2xl font-black text-[11px] flex items-center justify-center gap-2", inq.status === 'pending' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/30" : "bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-400")}>
                                    <Hourglass className="w-4 h-4" /> 상담대기
                                </button>
                                <button onClick={() => updateStatus(inq.id, 'completed')} className={cn("py-4 rounded-2xl font-black text-[11px] flex items-center justify-center gap-2", inq.status === 'completed' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100 dark:shadow-emerald-900/30" : "bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-400")}>
                                    <CheckCircle2 className="w-4 h-4" /> 상담완료
                                </button>
                                <button onClick={() => updateStatus(inq.id, 'canceled')} className={cn("py-4 rounded-2xl font-black text-[11px] flex items-center justify-center gap-2", inq.status === 'canceled' ? "bg-rose-600 text-white shadow-lg shadow-rose-100 dark:shadow-rose-900/30" : "bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-400")}>
                                    <XCircle className="w-4 h-4" /> 상담취소
                                </button>
                            </div>
                        </div>
                    ))}
            </div>

            {/* ✨ 삭제 확인 모달 (브라우저 confirm 대체) */}
            {deleteTargetId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTargetId(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-2xl">
                                <AlertTriangle className="w-6 h-6 text-rose-500" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">삭제 확인</h3>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                            이 상담 문의를 영구적으로 삭제합니다.<br />삭제 후 복구할 수 없습니다.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTargetId(null)}
                                className="flex-1 py-3 rounded-2xl font-bold text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                            >취소</button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-3 rounded-2xl font-bold text-sm bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-lg shadow-rose-100 dark:shadow-rose-900/30"
                            >삭제</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
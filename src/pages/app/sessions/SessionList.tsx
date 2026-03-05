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
import type { Database } from '@/types/database.types';
import { FileText, CheckCircle, Calendar, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/common/Skeleton';
import { useCenter } from '@/contexts/CenterContext'; // ✨ Import
import { toLocalDateStr } from '@/utils/timezone';

type Schedule = Database['public']['Tables']['schedules']['Row'] & {
    children: { name: string } | null;
    therapists: { name: string } | null;
};

export default function SessionList() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState<Schedule[]>([]);
    const { center } = useCenter(); // ✨ Use Center Context
    const centerId = center?.id;

    useEffect(() => {
        if (centerId) fetchSessions();
    }, [centerId]);

    const fetchSessions = async () => {
        if (!centerId) return; // 🔒 [Security] center_id 없으면 조회 차단
        setLoading(true);

        // ✨ [FIX] Auto-Complete DB 업데이트는 AppLayout의 useAutoCompleteSchedules에서 중앙 처리됨
        // 여기서는 로컬 데이터 보정만 수행 (UI 정합성)

        const { data, error } = await supabase
            .from('schedules')
            .select(`
                *,
                children ( name ),
                therapists ( name ),
                counseling_logs ( created_at, session_date )
            `)
            .eq('center_id', centerId) // 🔒 [Security] 센터 격리 필수 필터
            .order('start_time', { ascending: false });

        if (error) {
            console.error('Error fetching sessions:', error);
        } else {
            const sessionData = (data as Schedule[]) || [];
            // 로컬 데이터에서만 과거 scheduled를 completed로 표시 (UI 정합성)
            const now = new Date();
            sessionData.forEach((s: any) => {
                if (s.status === 'scheduled' && new Date(s.end_time) < now) {
                    s.status = 'completed';
                }
            });
            setSessions(sessionData);
        }
        setLoading(false);
    };

    const handleWriteNote = (scheduleId: string) => {
        navigate(`/app/sessions/${scheduleId}/note`);
    };

    const handleDelete = async (scheduleId: string) => {
        if (!window.confirm('정말 이 상담 일정을 삭제하시겠습니까?')) {
            return;
        }

        if (!centerId) return alert('센터 정보가 없습니다.');
        const { error } = await supabase
            .from('schedules')
            .delete()
            .eq('id', scheduleId)
            .eq('center_id', centerId);

        if (error) {
            alert('삭제 중 오류가 발생했습니다: ' + error.message);
        } else {
            fetchSessions();
        }
    };

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'completed':
                return <span className="flex items-center text-green-600"><CheckCircle className="w-4 h-4 mr-1" /> 완료</span>;
            case 'cancelled':
                return <span className="flex items-center text-red-500 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium">취소됨</span>;
            case 'carried_over':
                return <span className="flex items-center text-orange-500 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium">이월됨</span>;
            case 'scheduled':
            default:
                return <span className="flex items-center text-slate-500"><Calendar className="w-4 h-4 mr-1" /> 예정</span>;
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="w-48 h-8 rounded-lg" />
                </div>
                <div className="bg-white rounded-lg border shadow-sm">
                    {/* Desktop skeleton */}
                    <div className="hidden md:grid p-4 border-b bg-slate-50 grid-cols-12 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-6 col-span-2 rounded" />)}
                    </div>
                    <div className="divide-y">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="p-4">
                                {/* Mobile skeleton */}
                                <div className="md:hidden space-y-2">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-5 w-24 rounded" />
                                        <Skeleton className="h-5 w-16 rounded" />
                                    </div>
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-32 rounded" />
                                        <Skeleton className="h-7 w-14 rounded" />
                                    </div>
                                </div>
                                {/* Desktop skeleton */}
                                <div className="hidden md:grid grid-cols-12 gap-4">
                                    <Skeleton className="h-5 col-span-2 rounded w-20" />
                                    <Skeleton className="h-5 col-span-2 rounded w-16" />
                                    <Skeleton className="h-5 col-span-2 rounded w-24" />
                                    <Skeleton className="h-5 col-span-2 rounded w-12" />
                                    <Skeleton className="h-5 col-span-2 rounded w-16" />
                                    <div className="col-span-2 flex justify-center gap-2">
                                        <Skeleton className="h-8 w-16 rounded" />
                                        <Skeleton className="h-8 w-8 rounded" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">치료일지 관리</h1>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                {/* 📱 Desktop Header (md 이상에서만 표시) */}
                <div className="hidden md:grid p-4 border-b bg-slate-50 font-medium grid-cols-12 gap-4 text-sm text-slate-500">
                    <div className="col-span-2">날짜</div>
                    <div className="col-span-1">시간</div>
                    <div className="col-span-2">아동</div>
                    <div className="col-span-2">치료사</div>
                    <div className="col-span-1">유형</div>
                    <div className="col-span-2">상태</div>
                    <div className="col-span-2 text-center">관리</div>
                </div>

                <div className="divide-y">
                    {sessions.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            상담 내역이 없습니다.
                        </div>
                    ) : (
                        sessions.map((session: any) => (
                            <div key={session.id} className="hover:bg-slate-50 transition-colors">
                                {/* 📱 Mobile Layout */}
                                <div className="md:hidden p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">
                                                {session.children?.name || '-'}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-slate-600 font-medium">
                                                {session.service_type === 'evaluation' || session.service_type === 'assessment' ? '평가'
                                                    : session.service_type === 'counseling' || session.service_type === 'consultation' ? '상담'
                                                        : session.service_type || '수업'}
                                            </span>
                                        </div>
                                        {getStatusBadge(session.status)}
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span>
                                            {session.counseling_logs?.[0]?.session_date || toLocalDateStr(session.start_time)}
                                            {' '}
                                            {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {session.status === 'completed' ? (
                                                <button
                                                    className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                                                    onClick={() => handleWriteNote(session.id)}
                                                >
                                                    수정
                                                </button>
                                            ) : session.status === 'cancelled' || session.status === 'carried_over' ? null : (
                                                <button
                                                    className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded hover:bg-primary/90 flex items-center"
                                                    onClick={() => handleWriteNote(session.id)}
                                                >
                                                    <FileText className="w-3 h-3 mr-1" />
                                                    일지
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(session.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                                title="삭제"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* 🖥️ Desktop Layout (md 이상) */}
                                <div className="hidden md:grid p-4 grid-cols-12 gap-4 items-center text-sm">
                                    <div className="col-span-2">
                                        <div className="font-medium text-slate-900">
                                            {session.counseling_logs?.[0]?.session_date || toLocalDateStr(session.start_time)}
                                        </div>
                                        {session.counseling_logs?.[0]?.created_at && (
                                            <div className="text-xs text-slate-400 mt-0.5">
                                                (작성: {toLocalDateStr(session.counseling_logs[0].created_at)})
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-1">
                                        {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="col-span-2">
                                        {session.children?.name || '-'}
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-slate-700 font-medium">{session.therapists?.name || '-'}</span>
                                    </div>
                                    <div className="col-span-1">
                                        <span className="px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-700">
                                            {session.service_type === 'evaluation' || session.service_type === 'assessment' ? '평가'
                                                : session.service_type === 'counseling' || session.service_type === 'consultation' ? '상담'
                                                    : session.service_type || '수업'}
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        {getStatusBadge(session.status)}
                                    </div>
                                    <div className="col-span-2 flex justify-center items-center gap-2">
                                        {session.status === 'completed' ? (
                                            <button
                                                className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                                                onClick={() => handleWriteNote(session.id)}
                                            >
                                                수정하기
                                            </button>
                                        ) : session.status === 'cancelled' || session.status === 'carried_over' ? (
                                            <span className="text-xs text-slate-400">-</span>
                                        ) : (
                                            <button
                                                className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded hover:bg-primary/90 flex items-center"
                                                onClick={() => handleWriteNote(session.id)}
                                            >
                                                <FileText className="w-3 h-3 mr-1" />
                                                일지작성
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(session.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                            title="삭제"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

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
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ConsultationNote } from '@/components/app/consultations/ConsultationNote';
import { Users, Plus, ClipboardList, Search } from 'lucide-react';

export function ConsultationList() {
    const [children, setChildren] = useState([]);
    const [selectedChildId, setSelectedChildId] = useState('');
    const [centerId, setCenterId] = useState('');
    const [isWriting, setIsWriting] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        // 1. 센터 정보 및 아동 목록 가져오기
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('user_profiles').select('center_id').eq('id', user.id).maybeSingle();

        if (profile) {
            setCenterId(profile.center_id);
            const { data: childList } = await supabase.from('children').select('id, name').eq('center_id', profile.center_id);
            setChildren(childList || []);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">상담 및 발달 관리</h1>
                    <p className="text-slate-500 font-bold mt-1">아이들의 성장을 기록하고 점수를 부여합니다.</p>
                </div>
                <button
                    onClick={() => setIsWriting(!isWriting)}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                    {isWriting ? '목록 보기' : <><Plus className="w-5 h-5" /> 새 일지 작성</>}
                </button>
            </div>

            {isWriting ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-slate-50 rounded-xl"><Users className="w-5 h-5 text-slate-400" /></div>
                        <div className="flex-1">
                            <label className="block text-xs font-black text-slate-400 mb-1">작성할 아동 선택</label>
                            <select
                                value={selectedChildId}
                                onChange={(e) => setSelectedChildId(e.target.value)}
                                className="w-full bg-transparent font-black text-slate-700 outline-none cursor-pointer"
                            >
                                <option value="">아동을 선택해주세요</option>
                                {children.map(child => (
                                    <option key={child.id} value={child.id}>{child.name} 아동</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedChildId ? (
                        <ConsultationNote childId={selectedChildId} centerId={centerId} />
                    ) : (
                        <div className="bg-slate-50 p-20 rounded-[40px] text-center border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold">상담을 기록할 아동을 먼저 선택해주세요.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                    <div className="p-6 border-bottom flex items-center gap-2 font-black text-slate-900">
                        <ClipboardList className="w-5 h-5 text-primary" /> 최근 상담 기록
                    </div>
                    {/* 여기에 기존 상담 목록 리스트 테이블이 들어갑니다 */}
                    <div className="p-20 text-center text-slate-300 font-bold">
                        작성된 상담 기록이 표시되는 영역입니다.
                    </div>
                </div>
            )}
        </div>
    );
}
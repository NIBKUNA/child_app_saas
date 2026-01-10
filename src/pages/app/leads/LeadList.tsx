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
import type { Database } from '@/types/database.types';
import { Loader2, Phone, Trash2, Search, Filter } from 'lucide-react';

type Lead = Database['public']['Tables']['leads']['Row'];

export function LeadList() {
    const [loading, setLoading] = useState(true);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [filter, setFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        // ✨ 스키마 확인 결과 marketing_source가 아닌 'source' 컬럼을 사용합니다.
        let query = (supabase
            .from('leads') as any)
            .select('*')
            .order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching leads:', error);
        } else {
            setLeads(data || []);
        }
        setLoading(false);
    };

    const handleStatusChange = async (id: string, newStatus: Lead['status']) => {
        const { error } = await (supabase
            .from('leads') as any)
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            alert('상태 변경 실패: ' + error.message);
        } else {
            setLeads(leads.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead));
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('정말 이 상담 문의를 삭제하시겠습니까?')) return;

        const { error } = await (supabase
            .from('leads') as any)
            .delete()
            .eq('id', id);

        if (error) {
            alert('삭제 실패: ' + error.message);
        } else {
            fetchLeads();
        }
    };

    const filteredLeads = leads.filter(lead => {
        const matchesFilter = filter === 'all' || lead.status === filter;
        const matchesSearch =
            lead.parent_name?.includes(searchTerm) ||
            lead.child_name?.includes(searchTerm) ||
            lead.phone?.includes(searchTerm);
        return matchesFilter && matchesSearch;
    });

    if (loading) {
        return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;
    }

    return (
        <div className="space-y-6 text-left">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">상담 문의 관리</h1>
                    <p className="text-slate-500 font-medium mt-1">마케팅 유입 경로와 상담 상태를 실시간으로 확인합니다.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="이름, 연락처 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-50 outline-none w-64 transition-all"
                        />
                    </div>
                    <select
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold bg-white shadow-sm outline-none focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">전체 상태</option>
                        <option value="new">신규 (New)</option>
                        <option value="contacted">연락 완료</option>
                        <option value="scheduled">예약 완료</option>
                        <option value="converted">등록 완료</option>
                        <option value="cancelled">취소/보류</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">
                {/* 헤더: 가로형 레이아웃 최적화 */}
                <div className="p-6 border-b bg-slate-50/50 font-black grid grid-cols-12 gap-4 text-[11px] text-slate-400 uppercase tracking-widest">
                    <div className="col-span-1">신청일</div>
                    <div className="col-span-2">보호자 / 연락처</div>
                    <div className="col-span-1">아동 정보</div>
                    <div className="col-span-2 text-center">유입 경로 (UTM)</div>
                    <div className="col-span-3">문의 내용 / 서비스</div>
                    <div className="col-span-2 text-center">진행 상태</div>
                    <div className="col-span-1 text-center">관리</div>
                </div>

                <div className="divide-y divide-slate-100">
                    {filteredLeads.length === 0 ? (
                        <div className="p-20 text-center text-slate-400 font-bold text-lg">
                            문의 내역이 없습니다.
                        </div>
                    ) : (
                        filteredLeads.map((lead) => (
                            <div key={lead.id} className="p-6 grid grid-cols-12 gap-4 items-center text-sm hover:bg-indigo-50/30 transition-all group">
                                <div className="col-span-1 text-slate-400 font-medium tabular-nums">
                                    {new Date(lead.created_at).toLocaleDateString().slice(2)}
                                </div>
                                <div className="col-span-2">
                                    <div className="font-black text-slate-900 text-base">{lead.parent_name}</div>
                                    <div className="text-xs text-indigo-500 font-bold flex items-center mt-1">
                                        <Phone className="w-3 h-3 mr-1" /> {lead.phone}
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    <div className="font-bold text-slate-700">{lead.child_name || '-'}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                        {lead.child_birth_year ? `${lead.child_birth_year}년` : ''}
                                        {lead.child_gender === 'male' ? ' 남' : lead.child_gender === 'female' ? ' 여' : ''}
                                    </div>
                                </div>

                                {/* ✨ 유입 경로 표시 (DB의 source 컬럼 데이터) */}
                                <div className="col-span-2 text-center">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase shadow-sm ${lead.source ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-300 border-slate-100'
                                        }`}>
                                        {lead.source || 'Direct'}
                                    </span>
                                </div>

                                <div className="col-span-3">
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {lead.preferred_service?.slice(0, 2).map((service, i) => (
                                            <span key={i} className="px-1.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[9px] font-bold border border-slate-200">
                                                {service}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="text-xs text-slate-500 line-clamp-1 italic" title={lead.concern || ''}>
                                        {lead.concern || '내용 없음'}
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <select
                                        className={`w-full rounded-2xl border px-3 py-2.5 text-xs font-black outline-none transition-all shadow-sm cursor-pointer ${lead.status === 'new' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                lead.status === 'contacted' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    lead.status === 'converted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        'bg-slate-50 text-slate-600 border-slate-200'
                                            }`}
                                        value={lead.status}
                                        onChange={(e) => handleStatusChange(lead.id, e.target.value as any)}
                                    >
                                        <option value="new">신규 접수</option>
                                        <option value="contacted">연락 완료</option>
                                        <option value="scheduled">상담 예약</option>
                                        <option value="converted">등록 완료</option>
                                        <option value="cancelled">취소/보류</option>
                                    </select>
                                </div>

                                <div className="col-span-1 flex justify-center items-center gap-2">
                                    <button
                                        onClick={() => handleDelete(lead.id)}
                                        className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                        title="삭제"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
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
import { Helmet } from 'react-helmet-async';
import { Search, UserPlus, Pencil, Link as LinkIcon, User, Copy, Check, Eye } from 'lucide-react';
import { ChildModal } from './ChildModal';
import { ChildDetailModal } from '@/components/app/children/ChildDetailModal';
import { cn } from '@/lib/utils';

export function ChildList() {
    const [children, setChildren] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChildId, setSelectedChildId] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [detailChild, setDetailChild] = useState(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // 초대 코드 복사
    const copyInvitationCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(null), 2000);
        } catch (error) {
            console.error('복사 실패:', error);
        }
    };

    const handleOpenDetail = (child) => {
        setDetailChild(child);
        setIsDetailModalOpen(true);
    };

    useEffect(() => {
        fetchChildren();
    }, []);

    const fetchChildren = async () => {
        try {
            const { data, error } = await supabase
                .from('children')
                .select(`
                    *,
                    parent_profile:profiles!parent_id(name, email)
                `) // ✨ parent_id를 통해 연결된 보호자 계정 정보도 함께 가져옴
                .order('name');

            if (error) throw error;
            setChildren(data || []);
        } catch (error) {
            console.error('아동 목록 로딩 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredChildren = children.filter(child =>
        child.name.includes(searchTerm) ||
        (child.guardian_name && child.guardian_name.includes(searchTerm))
    );

    const handleEdit = (id) => {
        setSelectedChildId(id);
        setIsModalOpen(true);
    };

    // ✨ [Moved] Assessment feature now in ConsultationList - Developer: 안욱빈

    const handleRegister = () => {
        setSelectedChildId(null);
        setIsModalOpen(true);
    };

    const handleModalClose = (refresh) => {
        setIsModalOpen(false);
        setSelectedChildId(null);
        if (refresh) fetchChildren();
    };

    return (
        <>
            <Helmet><title>아동 관리 - 자라다 Admin</title></Helmet>

            <div className="space-y-6 p-2">
                <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">아동 관리</h1>
                        <p className="text-slate-500 font-medium">센터 이용 아동 및 보호자 계정 연결을 관리합니다.</p>
                    </div>
                    <button
                        onClick={handleRegister}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                    >
                        <UserPlus className="w-5 h-5" /> 신규 아동 등록
                    </button>
                </div>

                <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="아동 또는 보호자 이름 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[11px] tracking-wider">
                                <tr>
                                    <th className="px-6 py-5">기본 정보</th>
                                    <th className="px-6 py-5">생년월일/성별</th>
                                    <th className="px-6 py-5">초대 코드</th>
                                    <th className="px-6 py-5">연결된 앱 계정</th>
                                    <th className="px-6 py-5">보호자(수동입력)</th>
                                    <th className="px-6 py-5 text-center">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredChildren.length === 0 ? (
                                    <tr><td colSpan={6} className="p-20 text-center text-slate-400 font-bold">등록된 아동 정보가 없습니다.</td></tr>
                                ) : (
                                    filteredChildren.map((child) => (
                                        <tr key={child.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="font-black text-slate-900 text-base">{child.name}</div>
                                                <div className="text-[11px] text-slate-400 font-bold mt-0.5">{child.contact}</div>
                                            </td>
                                            <td className="px-6 py-5 text-slate-600 font-bold">
                                                {child.birth_date || '-'}
                                                <span className="ml-2 text-slate-300 text-xs">{child.gender}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                {child.invitation_code ? (
                                                    <button
                                                        onClick={() => copyInvitationCode(child.invitation_code)}
                                                        className={cn(
                                                            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all",
                                                            copiedCode === child.invitation_code
                                                                ? "bg-emerald-100 text-emerald-600"
                                                                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                                        )}
                                                    >
                                                        {copiedCode === child.invitation_code ? (
                                                            <><Check className="w-3.5 h-3.5" /> 복사됨!</>
                                                        ) : (
                                                            <><Copy className="w-3.5 h-3.5" /> {child.invitation_code}</>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-300 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                {child.parent_profile ? (
                                                    <div className="flex items-center gap-2 text-emerald-600 font-black">
                                                        <LinkIcon className="w-3.5 h-3.5" />
                                                        <span className="text-xs">{child.parent_profile.name} 계정</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-slate-300 font-bold">
                                                        <User className="w-3.5 h-3.5" />
                                                        <span className="text-xs italic text-slate-300">연결 안됨</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-slate-600 font-bold">{child.guardian_name || '-'}</td>
                                            <td className="px-6 py-5 text-center flex items-centerjustify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenDetail(child)}
                                                    className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all hover:shadow-md"
                                                    title="상세 정보 및 관찰일기 보기"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(child.id)}
                                                    className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all hover:shadow-md"
                                                    title="아동 정보 수정"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <ChildModal
                    isOpen={isModalOpen}
                    onClose={() => handleModalClose(false)}
                    childId={selectedChildId}
                    onSuccess={() => handleModalClose(true)}
                />
            )}

            {/* ✨ 상세 보기 모달 (치료사/관리자용) */}
            <ChildDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                child={detailChild}
            />

        </>
    );
}
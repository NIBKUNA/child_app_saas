// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import { Search, UserPlus, Pencil, Link as LinkIcon, User } from 'lucide-react';
import { ChildModal } from './ChildModal';

export function ChildList() {
    const [children, setChildren] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChildId, setSelectedChildId] = useState(null);

    useEffect(() => {
        fetchChildren();
    }, []);

    const fetchChildren = async () => {
        try {
            const { data, error } = await supabase
                .from('children')
                .select(`
                    *,
                    parent_profile:user_profiles!parent_id(name, email)
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
                                    <th className="px-6 py-5">진단명</th>
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
                                                <span className="px-3 py-1 bg-slate-100 rounded-full text-[11px] font-black text-slate-500">
                                                    {child.diagnosis || '일반'}
                                                </span>
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
                                            <td className="px-6 py-5 text-center">
                                                <button
                                                    onClick={() => handleEdit(child.id)}
                                                    className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 group-hover:text-slate-900 group-hover:border-slate-900 transition-all hover:shadow-md"
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
        </>
    );
}
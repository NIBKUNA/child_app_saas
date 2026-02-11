
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
import { Search, UserPlus, Pencil, Link as LinkIcon, User, Copy, Check, Eye, FileSpreadsheet } from 'lucide-react';
import { ChildModal } from './ChildModal';
import { ChildDetailModal } from '@/components/app/children/ChildDetailModal';
import { ExcelImportModal } from '@/components/app/children/ExcelImportModal';
import { cn } from '@/lib/utils';
import { ExcelExportButton } from '@/components/common/ExcelExportButton';
import { useAuth } from '@/contexts/AuthContext';
import { useCenter } from '@/contexts/CenterContext';

// ✨ 아동 성별 타입 (DB: 'male' | 'female', UI: '남' | '여')
type Gender = 'male' | 'female';

// ✨ 아동 정보 인터페이스 (schedules.child_id 와 일관성 유지)
export interface Child {
    id: string;                    // PK: schedules.child_id, payments.child_id 등과 FK 연결
    name: string;
    birth_date: string | null;
    gender: Gender | null;
    diagnosis: string | null;
    guardian_name: string | null;
    contact: string | null;
    address: string | null;
    memo: string | null;
    notes: string | null;
    registration_number: string | null;
    invitation_code: string | null;
    parent_id: string | null;      // parents.id 참조
    center_id: string;
    is_active: boolean | null;
    status: 'active' | 'waiting' | 'inactive' | null;
    created_at?: string;
    updated_at?: string;
}

export function ChildList() {
    const [children, setChildren] = useState<Child[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'waiting' | 'inactive'>('active');
    const [, setLoading] = useState(true);
    const { center } = useCenter();
    const centerId = center?.id;

    const { role, therapistId: authTherapistId } = useAuth();

    // 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [detailChild, setDetailChild] = useState<Child | null>(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);

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

    const handleOpenDetail = (child: Child) => {
        setDetailChild(child);
        setIsDetailModalOpen(true);
    };

    useEffect(() => {
        if (centerId) fetchChildren();
    }, [centerId, role, authTherapistId]);

    const fetchChildren = async () => {
        if (!centerId) return;
        try {
            let query = supabase
                .from('children')
                .select(`*`)
                .eq('center_id', centerId);

            // ✨ [권한 분리] 치료사는 본인이 담당하는 아동만 조회 가능
            if (role === 'therapist' && authTherapistId) {
                // child_therapist 테이블과의 조인을 통해 필터링
                const { data: assignments } = await supabase
                    .from('child_therapist')
                    .select('child_id')
                    .eq('therapist_id', authTherapistId);

                const assignedChildIds = (assignments as { child_id: string }[] | null)?.map(a => a.child_id) || [];
                query = query.in('id', assignedChildIds);
            }

            const { data, error } = await query.order('name');

            if (error) throw error;
            setChildren((data || []) as unknown as Child[]);
        } catch (error) {
            console.error('아동 목록 로딩 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredChildren = children.filter((child: Child) => {
        // 상태 필터 (status enum 기반)
        if (activeFilter !== 'all') {
            const childStatus = child.status || (child.is_active === false ? 'inactive' : 'active');
            if (childStatus !== activeFilter) return false;
        }
        // 검색 필터
        return child.name.includes(searchTerm) ||
            (child.guardian_name && child.guardian_name.includes(searchTerm));
    });

    const activeCount = children.filter(c => (c.status || 'active') === 'active').length;
    const waitingCount = children.filter(c => c.status === 'waiting').length;
    const inactiveCount = children.filter(c => c.status === 'inactive' || (!c.status && c.is_active === false)).length;

    const handleEdit = (id: string) => {
        setSelectedChildId(id);
        setIsModalOpen(true);
    };

    const handleRegister = () => {
        setSelectedChildId(null);
        setIsModalOpen(true);
    };

    const handleModalClose = (refresh: boolean) => {
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
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">아동 관리</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">센터 이용 아동 및 보호자 계정 연결을 관리합니다.</p>
                    </div>
                    <div className="flex gap-2">
                        {/* ✨ [Export] Excel Download Button */}
                        <ExcelExportButton
                            data={filteredChildren}
                            fileName="아동목록_전체"
                            headers={['name', 'birth_date', 'gender', 'guardian_name', 'contact', 'address', 'memo']}
                            headerLabels={{
                                name: '아동명',
                                birth_date: '생년월일',
                                gender: '성별',
                                guardian_name: '보호자명',
                                contact: '연락처',
                                address: '주소',
                                memo: '메모'
                            }}
                        />
                        {/* ✨ [Import] 케어플 엑셀 업로드 버튼 (admin/manager만) */}
                        {(role === 'admin' || role === 'manager' || role === 'super_admin') && (
                            <button
                                onClick={() => setIsExcelImportOpen(true)}
                                className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30"
                            >
                                <FileSpreadsheet className="w-5 h-5" /> 엑셀 업로드
                            </button>
                        )}
                        <button
                            onClick={handleRegister}
                            className="flex items-center gap-2 bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-lg shadow-slate-200 dark:shadow-indigo-900/30"
                        >
                            <UserPlus className="w-5 h-5" /> 신규 아동 등록
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/50">
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="아동 또는 보호자 이름 검색..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-slate-100 dark:focus:ring-indigo-500/20 transition-all"
                                />
                            </div>
                            {/* ✨ 활성/비활성 필터 */}
                            <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-2xl p-1">
                                {([['active', `이용중 (${activeCount})`], ['waiting', `대기 (${waitingCount})`], ['inactive', `종결 (${inactiveCount})`], ['all', '전체']] as const).map(([key, label]) => (
                                    <button
                                        key={key}
                                        onClick={() => setActiveFilter(key)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeFilter === key
                                            ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 font-black uppercase text-[11px] tracking-wider">
                                <tr>
                                    <th className="px-6 py-5">기본 정보</th>
                                    <th className="px-6 py-5">상태</th>
                                    <th className="px-6 py-5">생년월일/성별</th>
                                    <th className="px-6 py-5">초대 코드</th>
                                    <th className="px-6 py-5">연결된 앱 계정</th>
                                    <th className="px-6 py-5">보호자</th>
                                    <th className="px-6 py-5 text-center">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {filteredChildren.length === 0 ? (
                                    <tr><td colSpan={7} className="p-20 text-center text-slate-400 dark:text-slate-500 font-bold">
                                        {activeFilter === 'inactive' ? '종결/퇴원 아동이 없습니다.' : activeFilter === 'waiting' ? '대기 아동이 없습니다.' : '등록된 아동 정보가 없습니다.'}
                                    </td></tr>
                                ) : (
                                    filteredChildren.map((child) => (
                                        <tr key={child.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors group ${child.status === 'inactive' ? 'opacity-50' : ''}`}>
                                            <td className="px-6 py-5">
                                                <div className="font-black text-slate-900 dark:text-white text-base">{child.name}</div>
                                                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">{child.contact}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                {(() => {
                                                    const s = child.status || (child.is_active === false ? 'inactive' : 'active');
                                                    const cfg = {
                                                        active: { label: '이용중', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
                                                        waiting: { label: '대기', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
                                                        inactive: { label: '종결', cls: 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500' },
                                                    }[s] || { label: s, cls: 'bg-slate-100 text-slate-400' };
                                                    return <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black ${cfg.cls}`}>{cfg.label}</span>;
                                                })()}
                                            </td>
                                            <td className="px-6 py-5 text-slate-600 dark:text-slate-300 font-bold">
                                                {child.birth_date || '-'}
                                                <span className="ml-2 text-slate-300 dark:text-slate-500 text-xs">{child.gender}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                {child.invitation_code ? (
                                                    <button
                                                        onClick={() => copyInvitationCode(child.invitation_code!)}
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
                                                {child.parent_id ? (
                                                    <div className="flex items-center gap-2 text-emerald-600 font-black">
                                                        <LinkIcon className="w-3.5 h-3.5" />
                                                        <span className="text-xs">부모 계정 연결됨</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-slate-300 font-bold">
                                                        <User className="w-3.5 h-3.5" />
                                                        <span className="text-xs italic text-slate-300">연결 안됨</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-slate-600 dark:text-slate-300 font-bold">{child.guardian_name || '-'}</td>
                                            <td className="px-6 py-5 text-center flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenDetail(child)}
                                                    className="p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all hover:shadow-md"
                                                    title="상세 정보 및 관찰일기 보기"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(child.id)}
                                                    className="p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-900 dark:hover:border-slate-400 transition-all hover:shadow-md"
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

            <ChildDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                child={detailChild}
            />

            {/* ✨ 케어플 엑셀 임포트 모달 */}
            <ExcelImportModal
                centerId={centerId || ''}
                centerName={center?.name || ''}
                isOpen={isExcelImportOpen}
                onClose={(refresh) => {
                    setIsExcelImportOpen(false);
                    if (refresh) fetchChildren();
                }}
            />

        </>
    );
}
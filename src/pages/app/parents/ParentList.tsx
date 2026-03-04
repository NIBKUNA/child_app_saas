
/**
 * 🎨 Project: Zarada ERP
 * 🛠️ Created by: Gemini AI
 * 📅 Date: 2026-01-16
 * 🖋️ Description: "부모님 계정(User Profiles) 전체 관리 페이지"
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useCenter } from '@/contexts/CenterContext'; // ✨ Import
import { Helmet } from 'react-helmet-async';
import { Search, User, Shield, Ban, CheckCircle, Mail, RotateCcw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExcelExportButton } from '@/components/common/ExcelExportButton';

// ✨ 부모 계정 상태 타입
type ParentStatus = 'active' | 'blocked' | 'retired';

// ✨ 필터 탭 타입
type FilterTab = 'active' | 'blocked' | 'all';

// ✨ 연결된 자녀 정보 타입
interface ChildLink {
    id: string;
    name: string;
}

// ✨ 부모님 정보 인터페이스 (user_profiles 기반)
export interface Parent {
    id: string;                      // user_profiles.id (auth.users.id)
    name: string;
    email: string;
    status: ParentStatus;
    role: 'parent';
    center_id: string;
    created_at: string | null;
    updated_at: string | null;
    children: ChildLink[];           // 연결된 자녀 목록
}

export function ParentList() {
    const [parents, setParents] = useState<Parent[]>([]);
    const [, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<FilterTab>('active');
    const { center } = useCenter();

    useEffect(() => {
        if (center?.id) fetchParents();
    }, [center?.id]);

    const fetchParents = async () => {
        if (!center?.id) return;
        setLoading(true);
        try {
            // 1. Fetch all parents in this center (SaaS Logic)
            const { data: profiles, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('center_id', center.id)
                .eq('role', 'parent')
                .order('name', { ascending: true });

            if (error) throw error;
            const profileList = profiles as { id: string; name: string; email: string; status: string; center_id: string; created_at: string | null; updated_at: string | null }[] | null;

            // 2. [Improved] Get all Parent-Child connections for this center
            // This includes both direct (children.parent_id -> parents.id) 
            // and via family_relationships (parent_profile_id -> children.id)
            const { data: familyLinks } = await supabase
                .from('family_relationships')
                .select('parent_id, child_id, children(name)')
                .in('parent_id', profileList?.map(p => p.id) || []);
            const familyLinkList = familyLinks as { parent_id: string; child_id: string; children: { name: string } | null }[] | null;

            // Also get legacy links for compatibility
            const { data: parentsRecords } = await supabase
                .from('parents')
                .select('id, profile_id')
                .in('profile_id', profileList?.map(p => p.id) || []);
            const parentsRecordList = parentsRecords as { id: string; profile_id: string }[] | null;

            const { data: legacyChildren } = await supabase
                .from('children')
                .select('id, name, parent_id')
                .in('parent_id', parentsRecordList?.map(pr => pr.id) || []);
            const legacyChildrenList = legacyChildren as { id: string; name: string; parent_id: string }[] | null;

            // 3. [Merge] Combine all sources of truth
            const merged: Parent[] = (profileList || []).map(p => {
                const parentRecord = parentsRecordList?.find(pr => pr.profile_id === p.id);

                // Children from junction table
                const junctionChildren = familyLinkList
                    ?.filter(l => l.parent_id === p.id)
                    ?.map(l => ({ id: l.child_id, name: l.children?.name || '' })) || [];

                // Children from legacy parent_ptr
                const legacyMatched = parentRecord
                    ? legacyChildrenList?.filter(c => c.parent_id === parentRecord.id) || []
                    : [];

                // Unique set of children
                const allChildrenMap = new Map<string, ChildLink>();
                [...junctionChildren, ...legacyMatched].forEach(c => {
                    if (c && c.id) allChildrenMap.set(c.id, { id: c.id, name: c.name });
                });

                return {
                    id: p.id,
                    name: p.name,
                    email: p.email,
                    status: p.status as ParentStatus,
                    role: 'parent' as const,
                    center_id: p.center_id,
                    created_at: p.created_at,
                    updated_at: p.updated_at,
                    children: Array.from(allChildrenMap.values())
                };
            });
            setParents(merged);
        } catch (error) {
            console.error('부모 목록 로딩 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (parent: Parent) => {
        const isBlocked = parent.status === 'blocked' || parent.status === 'retired';
        const newStatus = isBlocked ? 'active' : 'blocked';
        const confirmMsg = isBlocked
            ? `${parent.name}님의 계정 차단을 해제하시겠습니까?`
            : `${parent.name}님의 계정을 차단하시겠습니까?\n(로그인이 불가능해집니다)`;

        if (!confirm(confirmMsg)) return;

        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ status: newStatus })
                .eq('id', parent.id);

            if (error) throw error;
            fetchParents();
        } catch (e) {
            const errMsg = e instanceof Error ? e.message : '알 수 없는 오류';
            alert('상태 변경 실패: ' + errMsg);
        }
    };

    // ✨ NEW: Delete Parent Function
    const handleDeleteParent = async (parent: Parent) => {
        const confirmMsg = `⚠️ 정말 ${parent.name}님의 계정을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.\n삭제 후 해당 이메일로 다시 회원가입할 수 있습니다.`;

        if (!confirm(confirmMsg)) return;

        try {
            // 1. Delete from user_profiles
            const { error: profileError } = await supabase
                .from('user_profiles')
                .delete()
                .eq('id', parent.id);

            if (profileError) throw profileError;

            // 2. Delete from auth.users via Database RPC (Secure)
            try {
                // This calls the 'admin_delete_user' Postgres function we created
                const { error: rpcError } = await supabase.rpc('admin_delete_user', { target_user_id: parent.id });
                if (rpcError) throw rpcError;
            } catch (e) {
                const warnMsg = e instanceof Error ? e.message : 'unknown';
                console.warn('Auth deletion warning:', warnMsg);
                // Even if RPC fails (e.g. already deleted), we proceed as user_profiles is gone
            }

            alert(`${parent.name}님의 계정이 삭제되었습니다.\n해당 이메일로 다시 회원가입이 가능합니다.`);
            fetchParents();
        } catch (e) {
            const errMsg = e instanceof Error ? e.message : '알 수 없는 오류';
            alert('삭제 실패: ' + errMsg);
        }
    };

    const handleResetPasswordEmail = async (email: string) => {
        if (!confirm(`${email} 주소로 비밀번호 재설정 메일을 발송하시겠습니까?`)) return;

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/auth/update-password',
            });
            if (error) throw error;
            alert('재설정 메일이 발송되었습니다.');
        } catch (e) {
            const errMsg = e instanceof Error ? e.message : '알 수 없는 오류';
            alert('메일 발송 실패: ' + errMsg);
        }
    };

    // ✨ MODIFIED: Filter by tab AND search term
    const filteredParents = parents.filter(p => {
        const matchesSearch = (p.name && p.name.includes(searchTerm)) || (p.email && p.email.includes(searchTerm));
        const matchesTab = activeTab === 'all' ? true :
            activeTab === 'blocked' ? (p.status === 'blocked' || p.status === 'retired') :
                p.status === 'active';
        return matchesSearch && matchesTab;
    });

    return (
        <div className="space-y-6 p-2 pb-20">
            <Helmet><title>부모님 계정 관리 - 자라다 Admin</title></Helmet>

            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">부모님 계정 관리</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">가입된 학부모 계정 목록 및 상태를 관리합니다.</p>
                </div>
                <div>
                    <ExcelExportButton
                        data={filteredParents.map(p => ({
                            ...p,
                            children_names: p.children.map(c => c.name).join(', ')
                        }))}
                        fileName="부모님_계정_목록"
                        headers={['name', 'email', 'children_names', 'status', 'created_at']}
                        headerLabels={{
                            name: '이름',
                            email: '이메일',
                            children_names: '자녀',
                            status: '상태',
                            created_at: '가입일'
                        }}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* ✨ NEW: Filter Tabs */}
                <div className="flex gap-2 p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={cn(
                            "px-4 py-2 rounded-xl font-bold text-sm transition-all",
                            activeTab === 'active' ? "bg-emerald-600 text-white shadow-md" : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600"
                        )}
                    >
                        ✅ 활성 계정
                    </button>
                    <button
                        onClick={() => setActiveTab('blocked')}
                        className={cn(
                            "px-4 py-2 rounded-xl font-bold text-sm transition-all",
                            activeTab === 'blocked' ? "bg-rose-600 text-white shadow-md" : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600"
                        )}
                    >
                        🚫 차단 목록
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={cn(
                            "px-4 py-2 rounded-xl font-bold text-sm transition-all",
                            activeTab === 'all' ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-md" : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600"
                        )}
                    >
                        📋 전체 보기
                    </button>
                </div>

                <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="이름 또는 이메일 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-slate-100 dark:focus:ring-indigo-500/20 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {/* 📱 모바일 카드 레이아웃 */}
                    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredParents.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 dark:text-slate-500 font-bold">
                                {activeTab === 'blocked' ? '차단된 계정이 없습니다.' : '검색 결과가 없습니다.'}
                            </div>
                        ) : filteredParents.map((parent) => (
                            <div key={parent.id} className="p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900 dark:text-white">{parent.name}</div>
                                            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{parent.email}</div>
                                        </div>
                                    </div>
                                    {parent.status === 'active' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black">
                                            <CheckCircle className="w-3 h-3" /> Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-black">
                                            <Ban className="w-3 h-3" /> Blocked
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs">
                                    <span className="text-slate-400 dark:text-slate-500 font-bold">자녀</span>
                                    {parent.children && parent.children.length > 0 ? (
                                        <span className="ml-2">{parent.children.map(c => (
                                            <span key={c.id} className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 text-xs font-bold mr-1">{c.name}</span>
                                        ))}</span>
                                    ) : (
                                        <span className="ml-2 text-slate-300">없음</span>
                                    )}
                                </div>
                                <div className="text-[10px] text-slate-400">가입: {parent.created_at ? new Date(parent.created_at).toLocaleDateString() : '-'}</div>
                                <div className="flex items-center gap-2 pt-1">
                                    <button onClick={() => handleResetPasswordEmail(parent.email)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="비밀번호 재설정">
                                        <Mail className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleToggleStatus(parent)} className={cn("p-2 rounded-lg transition-colors", parent.status === 'active' ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30" : "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30")} title={parent.status === 'active' ? "계정 차단" : "차단 해제"}>
                                        {parent.status === 'active' ? <Shield className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => handleDeleteParent(parent)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="계정 삭제">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 🖥️ 데스크톱 테이블 */}
                    <table className="hidden md:table w-full text-sm text-left min-w-[700px]">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 font-black uppercase text-[11px] tracking-wider">
                            <tr>
                                <th className="px-6 py-5">프로필 정보</th>
                                <th className="px-6 py-5">이메일 (ID)</th>
                                <th className="px-6 py-5">연결된 자녀</th>
                                <th className="px-6 py-5">상태</th>
                                <th className="px-6 py-5 text-center">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredParents.length === 0 ? (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-400 dark:text-slate-500 font-bold">
                                    {activeTab === 'blocked' ? '차단된 계정이 없습니다.' : '검색 결과가 없습니다.'}
                                </td></tr>
                            ) : (
                                filteredParents.map((parent) => (
                                    <tr key={parent.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 dark:text-white">{parent.name}</div>
                                                    <div className="text-[10px] text-slate-400 dark:text-slate-500">가입: {parent.created_at ? new Date(parent.created_at).toLocaleDateString() : '-'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-slate-600 dark:text-slate-300 font-bold font-mono text-xs">
                                            {parent.email}
                                        </td>
                                        <td className="px-6 py-5">
                                            {parent.children && parent.children.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {parent.children.map(c => (
                                                        <span key={c.id} className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 text-indigo-600 text-xs font-bold">
                                                            {c.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 text-xs">자녀 없음</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            {parent.status === 'active' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-wide">
                                                    <CheckCircle className="w-3 h-3" /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-wide">
                                                    <Ban className="w-3 h-3" /> Blocked
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-center flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleResetPasswordEmail(parent.email)}
                                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                title="비밀번호 재설정 메일 발송"
                                            >
                                                <Mail className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(parent)}
                                                className={cn(
                                                    "p-2 rounded-lg transition-colors",
                                                    parent.status === 'active'
                                                        ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                                                        : "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                                                )}
                                                title={parent.status === 'active' ? "계정 차단" : "차단 해제"}
                                            >
                                                {parent.status === 'active' ? <Shield className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                                            </button>
                                            {/* ✨ NEW: Delete Button */}
                                            <button
                                                onClick={() => handleDeleteParent(parent)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                title="계정 삭제 (재가입 가능)"
                                            >
                                                <Trash2 className="w-4 h-4" />
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
    );
}

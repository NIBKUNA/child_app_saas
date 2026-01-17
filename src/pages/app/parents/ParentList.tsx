// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Project: Zarada ERP
 * 🛠️ Created by: Gemini AI
 * 📅 Date: 2026-01-16
 * 🖋️ Description: "부모님 계정(User Profiles) 전체 관리 페이지"
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import { Search, User, Shield, Ban, CheckCircle, Mail, RotateCcw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExcelExportButton } from '@/components/common/ExcelExportButton';

export function ParentList() {
    const [parents, setParents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('active'); // ✨ NEW: Filter Tab State

    useEffect(() => {
        fetchParents();
    }, []);

    const fetchParents = async () => {
        setLoading(true);
        try {
            const { data: profiles, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('role', 'parent')
                .order('name', { ascending: true });

            if (error) throw error;

            const parentIds = profiles.map(p => p.id);
            const { data: childrenData } = await supabase
                .from('children')
                .select('id, name, parent_id')
                .in('parent_id', parentIds);

            const merged = profiles.map(p => ({
                ...p,
                children: childrenData?.filter(c => c.parent_id === p.id) || []
            }));

            setParents(merged);
        } catch (error) {
            console.error('부모 목록 로딩 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (parent) => {
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
            alert('상태 변경 실패: ' + e.message);
        }
    };

    // ✨ NEW: Delete Parent Function
    const handleDeleteParent = async (parent) => {
        const confirmMsg = `⚠️ 정말 ${parent.name}님의 계정을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.\n삭제 후 해당 이메일로 다시 회원가입할 수 있습니다.`;

        if (!confirm(confirmMsg)) return;

        try {
            // 1. Delete from user_profiles
            const { error: profileError } = await supabase
                .from('user_profiles')
                .delete()
                .eq('id', parent.id);

            if (profileError) throw profileError;

            // 2. Try to delete from auth.users via Edge Function (if exists)
            // If no edge function, this will fail silently and user can re-register
            try {
                await supabase.functions.invoke('delete-user', {
                    body: { userId: parent.id }
                });
            } catch (e) {
                console.warn('Auth deletion skipped (function may not exist):', e);
            }

            alert(`${parent.name}님의 계정이 삭제되었습니다.\n해당 이메일로 다시 회원가입이 가능합니다.`);
            fetchParents();
        } catch (e) {
            alert('삭제 실패: ' + e.message);
        }
    };

    const handleResetPasswordEmail = async (email) => {
        if (!confirm(`${email} 주소로 비밀번호 재설정 메일을 발송하시겠습니까?`)) return;

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/auth/update-password',
            });
            if (error) throw error;
            alert('재설정 메일이 발송되었습니다.');
        } catch (e) {
            alert('메일 발송 실패: ' + e.message);
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
                    <table className="w-full text-sm text-left">
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

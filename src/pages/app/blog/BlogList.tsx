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
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Plus, Loader2, Pencil, Trash2, RefreshCw } from 'lucide-react';

export default function BlogList() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // ✨ [Fix] 함수명 변경 (loadBlogPosts) - 캐시 충돌 방지
    const loadBlogPosts = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPosts(data || []);
        } catch (error) {
            console.error('글 목록 로딩 실패:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // ✨ 데이터 로딩 로직
    useEffect(() => {
        loadBlogPosts();
    }, [loadBlogPosts]);

    const handleDelete = async (id, title) => {
        if (!confirm(`"${title}" 글을 정말 삭제하시겠습니까?`)) return;
        try {
            const { error } = await supabase.from('blog_posts').delete().eq('id', id);
            if (error) throw error;
            setPosts(prev => prev.filter(p => p.id !== id));
            alert('삭제되었습니다.');
        } catch (error) {
            alert('삭제 실패');
        }
    };

    const filteredPosts = posts.filter(post =>
        (post.title || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen text-left">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        블로그 관리
                        <span className="text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full">{posts.length}개</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">홈페이지에 노출되는 모든 포스팅을 관리합니다.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={loadBlogPosts} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <Link to="/app/blog/new" className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 hover:bg-indigo-700 transition-all active:scale-95">
                        <Plus size={20} /> 새 글 작성
                    </Link>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="글 제목으로 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/20 text-slate-900 dark:text-white transition-all font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-10 py-6">제목</th>
                                <th className="px-10 py-6 text-center">작성일</th>
                                <th className="px-10 py-6 text-right">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {loading && posts.length === 0 ? (
                                <tr><td colSpan={3} className="p-32 text-center"><Loader2 className="animate-spin inline-block w-10 h-10 text-indigo-500" /></td></tr>
                            ) : filteredPosts.length === 0 ? (
                                <tr><td colSpan={3} className="p-32 text-center text-slate-400 dark:text-slate-500 font-bold">표시할 글이 없습니다.</td></tr>
                            ) : (
                                filteredPosts.map((post) => (
                                    <tr key={post.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all group">
                                        <td className="px-10 py-8 font-bold text-slate-800 dark:text-slate-200 text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {post.title || '제목 없음'}
                                        </td>
                                        <td className="px-10 py-8 text-center text-slate-400 dark:text-slate-600 font-bold">
                                            {new Date(post.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => navigate(`/app/blog/${post.id}`)} className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all shadow-sm">
                                                    <Pencil size={20} />
                                                </button>
                                                <button onClick={() => handleDelete(post.id, post.title)} className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white transition-all shadow-sm">
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
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
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
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { useCenter } from '@/contexts/CenterContext';
import { useCenterBranding } from '@/hooks/useCenterBranding'; // ✨ Import

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    cover_image_url: string | null;
    published_at: string | null;
}

export function BlogPage() {
    const { getSetting } = useAdminSettings();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const { center } = useCenter();
    const { branding } = useCenterBranding(); // ✨ Unified Branding

    useEffect(() => {
        // ✨ Only fetch if we have a center context
        if (center) fetchPosts();
    }, [center]);

    const fetchPosts = async () => {
        if (!center) return;

        const { data, error } = await supabase
            .from('blog_posts')
            .select('id, title, slug, excerpt, cover_image_url, published_at')
            .eq('is_published', true)
            .eq('center_id', center.id) // ✨ Strict Tenant Filtering
            .order('published_at', { ascending: false });

        if (error) {
            console.error('Error fetching blog posts:', error);
        } else {
            setPosts(data || []);
        }
        setLoading(false);
    };

    // ✨ Dynamic Title from Settings or Center DB
    const centerName = branding.name || getSetting('center_name') || center?.name || 'Center Blog';

    return (
        <div className={cn(
            "min-h-screen pb-24 font-sans transition-colors",
            isDark ? "bg-slate-950 text-white" : "bg-white text-slate-900"
        )}>
            <Helmet>
                <title>마음 성장 칼럼 | {centerName}</title>
                <meta name="description" content={`${centerName} 전문가들이 전하는 우리 아이의 건강한 성장을 위한 따뜻한 조언과 발달 정보를 확인하세요.`} />
                <link rel="canonical" href={`${window.location.origin}${window.location.pathname}`} />
                <meta property="og:title" content={`마음 성장 칼럼 | ${centerName}`} />
                <meta property="og:description" content={`${centerName} 전문가들이 전하는 발달 정보와 조언.`} />
                <meta property="og:url" content={`${window.location.origin}${window.location.pathname}`} />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content={centerName} />
                <meta property="og:locale" content="ko_KR" />
            </Helmet>

            {/* Spacious Centered Header */}
            <header className="pt-32 pb-20 px-6 text-center max-w-4xl mx-auto">
                <p
                    className="font-bold tracking-widest text-sm mb-4"
                    style={{ color: branding.brand_color || undefined }} // ✨ Usage
                >
                    아이와 함께 성장하는 이야기
                </p>
                <h1 className={cn(
                    "text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight",
                    isDark ? "text-white" : "text-slate-900"
                )}>
                    마음 성장 칼럼
                </h1>
                <p className={cn(
                    "text-lg md:text-xl font-medium leading-relaxed break-keep",
                    isDark ? "text-slate-400" : "text-slate-500"
                )}>
                    우리 아이의 건강한 발달을 위한 전문가들의 따뜻한 조언
                </p>
            </header>

            {/* Magazine Grid Layout */}
            <main className="max-w-7xl mx-auto px-6">
                {loading ? (
                    <div className="text-center py-32">
                        <p className={cn(
                            "text-xl font-medium animate-pulse",
                            isDark ? "text-slate-500" : "text-slate-400"
                        )}>칼럼을 불러오는 중입니다...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className={cn(
                        "text-center py-32 border-t",
                        isDark ? "border-slate-800" : "border-slate-100"
                    )}>
                        <p className={cn(
                            "text-xl font-bold",
                            isDark ? "text-slate-500" : "text-slate-400"
                        )}>아직 등록된 칼럼이 없습니다.</p>
                        <p className={cn(
                            "mt-2",
                            isDark ? "text-slate-600" : "text-slate-400"
                        )}>조금만 기다려주세요, 알찬 내용을 준비 중입니다.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14">
                        {posts.map((post) => (
                            <Link
                                key={post.id}
                                // ✨ Fix routing for nested center paths
                                to={`${window.location.pathname}/${post.slug}`}
                                className="group block h-full flex flex-col"
                            >
                                {/* Thumbnail: 16:9 Aspect Ratio */}
                                <div className={cn(
                                    "relative aspect-[16/9] overflow-hidden rounded-2xl mb-6 transition-all duration-300 ease-out",
                                    isDark
                                        ? "bg-slate-800 shadow-md shadow-black/20 group-hover:shadow-xl"
                                        : "bg-slate-100 shadow-sm group-hover:shadow-lg"
                                )}>
                                    {post.cover_image_url ? (
                                        <img
                                            src={post.cover_image_url}
                                            alt={post.title || ''}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                        />
                                    ) : (
                                        <div className={cn(
                                            "w-full h-full flex items-center justify-center font-black text-2xl tracking-tight",
                                            isDark ? "bg-slate-800 text-slate-600" : "bg-slate-50 text-slate-300"
                                        )}>
                                            NO IMAGE
                                        </div>
                                    )}
                                    {/* Overlay on hover */}
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col">
                                    {/* Minimal Date */}
                                    <div className={cn(
                                        "text-xs font-bold tracking-wide uppercase mb-3",
                                        isDark ? "text-slate-500" : "text-slate-400"
                                    )}>
                                        {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                                    </div>

                                    {/* Bold Title */}
                                    <h2
                                        className={cn(
                                            "text-2xl font-black leading-tight mb-3 line-clamp-2 transition-colors duration-300",
                                            isDark ? "text-white" : "text-slate-900"
                                        )}
                                        // Dynamic Color on hover
                                        onMouseEnter={(e) => e.currentTarget.style.color = branding.brand_color || ''}
                                        onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                                    >
                                        {post.title || ''}
                                    </h2>

                                    {/* Excerpt */}
                                    <p className={cn(
                                        "font-medium leading-relaxed line-clamp-3 text-base flex-1",
                                        isDark ? "text-slate-400" : "text-slate-500"
                                    )}>
                                        {post.excerpt}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

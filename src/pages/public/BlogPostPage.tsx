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
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Share2, MessageSquare, Quote, Edit } from 'lucide-react';
import { ConsultationSurveyModal } from '@/components/public/ConsultationSurveyModal';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useAuth } from '@/contexts/AuthContext';
import { BlogEditModal } from '@/components/admin/BlogEditModal';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    cover_image_url: string;
    published_at: string;
    view_count: number;
    seo_title: string;
    seo_description: string;
    keywords: string[] | string | null;
}

export function BlogPostPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { getSetting } = useAdminSettings();
    const { role } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [centerInfo, setCenterInfo] = useState<any>(null);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 300);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchPost = async () => {
        setLoading(true);
        const { data: postData, error: postError } = await (supabase as any)
            .from('blog_posts')
            .select('*')
            .eq('slug', slug)
            .eq('is_published', true)
            .maybeSingle();

        if (postError) {
            console.error('Error fetching post:', postError);
            if (postError.code === 'PGRST116') {
                navigate('/blog', { replace: true });
            }
        } else if (postData) {
            setPost(postData);
            // ✨ [SEO Engine] Fetch specific center context for this post
            if (postData.center_id) {
                const { data: centerData } = await (supabase as any)
                    .from('centers')
                    .select('name, address, phone, naver_map_url')
                    .eq('id', postData.center_id) // Strict Isolation
                    .maybeSingle();
                setCenterInfo(centerData);
            } else {
                // Fallback to default if no center assigned
                fetchCenterInfo();
            }

            // Increment view count in background
            await (supabase as any).from('blog_posts').update({ view_count: (postData.view_count || 0) + 1 }).eq('id', postData.id);
        } else {
            navigate('/blog', { replace: true });
        }
        setLoading(false);
    };

    const fetchCenterInfo = async () => {
        const { data } = await (supabase as any)
            .from('centers')
            .select('name, address, phone, naver_map_url')
            .limit(1)
            .maybeSingle();
        if (data) setCenterInfo(data);
    };

    useEffect(() => {
        if (slug) {
            fetchPost();
        }
        // fetchCenterInfo is now called inside fetchPost depending on context
    }, [slug]);

    if (loading) return <div className={cn("min-h-screen", isDark ? "bg-slate-950" : "bg-white")} />;
    if (!post) return null;

    const keywordsArray = Array.isArray(post.keywords)
        ? post.keywords
        : (typeof post.keywords === 'string' ? (post.keywords as string).split(',') : []);

    // ✨ [SEO Engine] Dynamic Meta Generation
    const centerName = centerInfo?.name || getSetting('center_name') || '아동발달센터';
    const centerAddress = centerInfo?.address || getSetting('center_address') || '';
    const centerPhone = centerInfo?.phone || getSetting('center_phone') || '';

    // Extract Region (e.g., "송파구", "강남구")
    const regionMatch = centerAddress.match(/(\S+[시군구])/);
    const region = regionMatch ? regionMatch[1] : '';
    const fullTitle = `${post.title} | ${centerName} ${region && `(${region})`}`;

    const metaDesc = post.seo_description || post.excerpt || `${region} ${centerName}에서 전하는 ${post.title}에 대한 이야기입니다.`;
    const currentUrl = window.location.href;

    // ✨ [SEO Engine] Advanced Local Business Schema
    const schemaJsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BlogPosting",
                "headline": fullTitle,
                "description": metaDesc,
                "image": post.cover_image_url || undefined,
                "datePublished": post.published_at,
                "author": {
                    "@type": "Organization",
                    "name": centerName,
                    "url": window.location.origin
                },
                "publisher": {
                    "@type": "Organization",
                    "name": centerName,
                    "logo": {
                        "@type": "ImageObject",
                        "url": getSetting('center_logo') || ''
                    }
                },
                "mainEntityOfPage": currentUrl,
                "keywords": keywordsArray.join(', ')
            },
            {
                "@type": "LocalBusiness",
                "name": centerName,
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": centerAddress,
                    "addressCountry": "KR",
                    "addressRegion": region // Explicit Region
                },
                "telephone": centerPhone,
                "url": window.location.origin,
                "priceRange": "$$",
                "image": getSetting('center_logo') || undefined
            }
        ]
    };

    return (
        <div className={cn(
            "min-h-screen pb-24 font-sans leading-relaxed transition-colors",
            isDark
                ? "bg-slate-950 text-slate-100 selection:bg-indigo-900 selection:text-indigo-100"
                : "bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900"
        )}>
            <Helmet>
                {/* Basic Meta Tags */}
                <title>{fullTitle}</title>
                <meta name="description" content={metaDesc} />
                <meta name="keywords" content={keywordsArray.join(', ')} />

                {/* Open Graph (Facebook, KakaoTalk) */}
                <meta property="og:type" content="article" />
                <meta property="og:title" content={fullTitle} />
                <meta property="og:description" content={metaDesc} />
                <meta property="og:url" content={currentUrl} />
                <meta property="og:site_name" content={centerName} />
                <meta property="og:locale" content="ko_KR" />
                {post.cover_image_url && <meta property="og:image" content={post.cover_image_url} />}
                {post.cover_image_url && <meta property="og:image:width" content="1200" />}
                {post.cover_image_url && <meta property="og:image:height" content="630" />}

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={fullTitle} />
                <meta name="twitter:description" content={metaDesc} />
                {post.cover_image_url && <meta name="twitter:image" content={post.cover_image_url} />}

                {/* Naver Verification & SEO */}
                <meta name="naver-site-verification" content="" />

                {/* Canonical URL */}
                <link rel="canonical" href={currentUrl} />

                {/* Schema.org JSON-LD */}
                <script type="application/ld+json">
                    {JSON.stringify(schemaJsonLd)}
                </script>
            </Helmet>

            <ConsultationSurveyModal
                isOpen={isConsultModalOpen}
                onClose={() => setIsConsultModalOpen(false)}
                centerId={(post as any)?.center_id || centerInfo?.id} // ✨ Pass centerId from post or fallback
            />

            {post && (
                <BlogEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    post={post}
                    onUpdate={fetchPost}
                />
            )}



            {/* Navigation */}
            <nav className={cn(
                "sticky top-0 z-50 border-b transition-all duration-300",
                isDark
                    ? "bg-slate-950/90 border-slate-800"
                    : "bg-white/90 backdrop-blur-sm border-slate-100",
                scrolled && "shadow-sm"
            )}>
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
                    <Link to="/blog" className={cn(
                        "group flex items-center gap-2 font-bold text-sm transition-colors shrink-0",
                        isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
                    )}>
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                            isDark
                                ? "bg-slate-800 group-hover:bg-indigo-900 group-hover:text-indigo-400"
                                : "bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                        )}>
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span className="hidden sm:inline">블로그 목록으로</span>
                    </Link>

                    {/* ✨ Sticky Title (Appears on Scroll) */}
                    <div className={cn(
                        "flex-1 text-center transition-all duration-500 overflow-hidden",
                        scrolled ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                    )}>
                        <h2 className={cn(
                            "text-sm font-bold truncate max-w-[200px] md:max-w-md mx-auto",
                            isDark ? "text-white" : "text-slate-900"
                        )}>
                            {post.title}
                        </h2>
                    </div>

                    <button
                        onClick={() => setIsConsultModalOpen(true)}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg ring-2 ring-indigo-400/20 shrink-0"
                    >
                        상담 문의하기
                    </button>
                </div>
            </nav>

            <main className="max-w-[800px] mx-auto px-6 py-12 md:py-20" style={{ fontFamily: '"Pretendard", "Pretendard JP", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif' }}>
                <article>
                    {/* Hero Section */}
                    <header className="mb-12 text-center space-y-8">
                        {/* Category/Keywords */}
                        <div className="flex flex-wrap justify-center gap-2">
                            {keywordsArray.map((k: string, i: number) => (
                                <span key={i} className={cn(
                                    "font-bold tracking-widest text-xs uppercase border px-3 py-1 rounded-full",
                                    isDark ? "text-slate-400 border-slate-700" : "text-slate-500 border-slate-200"
                                )}>
                                    {k.trim()}
                                </span>
                            ))}
                        </div>

                        {/* Title - Magazine Style */}
                        <h1 className={cn(
                            "text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.2] break-keep",
                            isDark ? "text-white" : "text-slate-900"
                        )}>
                            {post.title}
                        </h1>

                        {/* Metadata - Minimalist */}
                        <div className={cn(
                            "flex items-center justify-center gap-4 text-sm font-medium pt-2 border-t mt-8 w-24 mx-auto pt-8",
                            isDark ? "text-slate-500 border-slate-800" : "text-slate-400 border-slate-100"
                        )}>
                            <span className="flex items-center gap-1.5 uppercase tracking-widest text-xs">
                                {new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>

                        {/* Admin Edit Button */}
                        {(role === 'admin' || role === 'therapist') && (
                            <div className="flex justify-center mt-4">
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-full shadow-md hover:bg-slate-800 transition-all hover:-translate-y-0.5"
                                >
                                    <Edit className="w-3 h-3" /> 센터장님 수정하기
                                </button>
                            </div>
                        )}
                    </header>

                    {/* Featured Image - Full Width within container */}
                    {post.cover_image_url && (
                        <div className="rounded-xl overflow-hidden aspect-[16/9] mb-16 shadow-sm">
                            <img src={post.cover_image_url} alt={`${post.title} - ${centerName}`} className="w-full h-full object-cover transition-transform hover:scale-105 duration-700" />
                        </div>
                    )}

                    {/* Intro Box (Summary) - Magazine Quote Style */}
                    {post.excerpt && (
                        <div className="relative mb-20 p-10 bg-white border-y-2 border-slate-900 text-center">
                            <Quote className="w-8 h-8 text-slate-900 mx-auto mb-6 opacity-20" />
                            <p className="relative z-10 text-xl md:text-2xl font-bold text-slate-900 leading-relaxed italic">
                                "{post.excerpt}"
                            </p>
                        </div>
                    )}

                    {/* Content Body - Magazine Typography */}
                    {/* leading-[1.8] line-height, expansive headers */}
                    <div className="prose prose-lg prose-slate max-w-none 
                        prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900
                        prose-h2:text-3xl prose-h2:mt-20 prose-h2:mb-8 prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-4
                        prose-p:text-slate-600 prose-p:leading-[1.8] prose-p:mb-6
                        prose-blockquote:border-l-0 prose-blockquote:border-slate-900 prose-blockquote:pl-0 
                        prose-blockquote:font-bold prose-blockquote:text-2xl prose-blockquote:leading-normal prose-blockquote:italic prose-blockquote:text-slate-900 prose-blockquote:text-center prose-blockquote:py-10 prose-blockquote:px-8
                        prose-blockquote:bg-slate-50 prose-blockquote:rounded-2xl
                        prose-img:rounded-xl prose-img:shadow-lg prose-img:my-12
                        prose-strong:text-slate-900 prose-strong:font-bold prose-strong:bg-transparent prose-strong:border-b-2 prose-strong:border-yellow-200 prose-strong:px-1
                        font-medium">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                img: ({ node, ...props }) => <img {...props} className="rounded-xl shadow-lg my-12 w-full h-auto" loading="lazy" />,
                            }}
                        >
                            {post.content}
                        </ReactMarkdown>
                    </div>

                    {/* Share Section */}
                    <div className="mt-20 pt-10 border-t border-slate-100 flex justify-center">
                        <button
                            onClick={() => {
                                const url = window.location.href;
                                if (navigator.share) {
                                    navigator.share({ title: post.title, url }).catch(console.error);
                                } else {
                                    navigator.clipboard.writeText(url).then(() => alert('링크가 복사되었습니다!'));
                                }
                                // Kakao Share Logic (Optional, requires valid key in index.html)
                                const kakaoWin = window as any;
                                if (kakaoWin.Kakao?.isInitialized()) {
                                    kakaoWin.Kakao.Share.sendDefault({
                                        objectType: 'feed',
                                        content: {
                                            title: post.title,
                                            description: post.excerpt || `${centerName} 블로그`,
                                            imageUrl: post.cover_image_url || '',
                                            link: { mobileWebUrl: url, webUrl: url },
                                        },
                                    });
                                }
                            }}
                            className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-full text-slate-600 font-bold hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm group"
                        >
                            <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            이 유용한 정보를 다른 부모님과 공유하세요
                        </button>
                    </div>

                    {/* Bottom CTA Area - Magazine Style */}
                    <div className="mt-20 space-y-20">
                        {/* CTA Box */}
                        <div className="bg-slate-900 rounded-[40px] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl shadow-slate-900/20">
                            {/* Decorative Elements */}
                            <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                            <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

                            <div className="relative z-10 space-y-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 text-yellow-400 mb-2">
                                    <MessageSquare className="w-8 h-8" />
                                </div>

                                <h3 className="text-3xl md:text-4xl font-black text-white leading-tight">
                                    우리 아이 발달 고민,<br />
                                    <span className="text-indigo-400">혼자 고민하지 마세요.</span>
                                </h3>

                                <p className="text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
                                    전문 치료사와의 1:1 상담을 통해 아이의 현재 상태를 점검하고,<br className="hidden md:block" />
                                    가장 알맞은 성장 로드맵을 그려보세요.
                                </p>

                                <button
                                    onClick={() => setIsConsultModalOpen(true)}
                                    className="inline-block px-10 py-5 bg-white text-slate-900 rounded-full font-black text-lg hover:bg-yellow-400 transition-colors shadow-lg shadow-white/10"
                                >
                                    무료 상담 신청하기
                                </button>
                            </div>
                        </div>

                        {/* Location & Contact Section */}
                        <div className="border-t-2 border-slate-100 pt-20">
                            <div className="text-center space-y-8">
                                <div className="space-y-2">
                                    <h4 className="text-sm font-black text-indigo-600 tracking-widest uppercase">Location & Contact</h4>
                                    <h2 className="text-3xl font-black text-slate-900">센터 오시는 길</h2>
                                </div>

                                <div className="text-left bg-slate-50 p-8 rounded-3xl border border-slate-100">
                                    <div className="space-y-6">
                                        <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Address</p>
                                                <p className="text-lg font-bold text-slate-700">{centerAddress || '주소 정보 없음'}</p>
                                                <p className="text-sm text-slate-500 mt-1">{centerName}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Contact</p>
                                                <a href={`tel:${centerPhone}`} className="text-2xl font-black text-slate-900 hover:text-indigo-600 transition-colors">
                                                    {centerPhone || '전화번호 정보 없음'}
                                                </a>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4 border-t border-slate-200">
                                            {/* ✨ 네이버 지도 버튼 - Dynamic URL */}
                                            {(() => {
                                                const naverMapUrl = centerInfo?.naver_map_url;
                                                const fallbackSearchUrl = `https://map.naver.com/v5/search/${encodeURIComponent(centerAddress || centerName)}`;
                                                const mapUrl = naverMapUrl || fallbackSearchUrl;

                                                return (
                                                    <a
                                                        href={mapUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex-1 inline-flex justify-center items-center gap-2 px-6 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-base transition-all shadow-lg shadow-green-200"
                                                    >
                                                        <span className="text-xl">📍</span>
                                                        네이버 지도로 길 찾기
                                                    </a>
                                                );
                                            })()}

                                            {/* Secondary action - Kakao Map fallback */}
                                            <a
                                                href={`https://map.kakao.com/?q=${encodeURIComponent(centerAddress || centerName || '아동발달센터')}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex-1 inline-flex justify-center items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 hover:bg-yellow-50 hover:border-yellow-200 hover:text-yellow-700 rounded-xl font-bold transition-all"
                                            >
                                                <span>🗺️</span> 카카오맵으로 보기
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </article>
            </main>
        </div>
    );
}

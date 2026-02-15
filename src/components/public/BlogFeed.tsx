/**
 * 📰 BlogFeed — 센터별 네이버 블로그 피드 자동 연동 컴포넌트
 * 
 * SettingsPage의 SNS 설정에서 입력한 네이버 블로그 URL을 기반으로
 * 최신 포스트를 자동으로 가져와 표시합니다.
 * 
 * 각 센터는 자기 블로그만 표시됩니다 (센터별 admin_settings 기반).
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Newspaper, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlogPost {
    title: string;
    link: string;
    description: string;
    pubDate: string;
    thumbnail: string | null;
}

interface BlogFeedProps {
    /** 센터의 네이버 블로그 URL (예: https://blog.naver.com/zarada_jamsil) */
    blogUrl: string;
    /** 다크모드 여부 */
    isDark?: boolean;
    /** 표시할 최대 포스트 수 (기본: 4) */
    maxPosts?: number;
}

export function BlogFeed({ blogUrl, isDark = false, maxPosts = 4 }: BlogFeedProps) {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [blogTitle, setBlogTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!blogUrl) {
            setLoading(false);
            return;
        }

        const fetchBlog = async () => {
            try {
                setLoading(true);
                setError(false);

                const res = await fetch(`/api/blog-feed?blogUrl=${encodeURIComponent(blogUrl)}&count=${maxPosts}`);
                if (!res.ok) throw new Error('Failed to fetch');

                const data = await res.json();
                setPosts(data.posts || []);
                setBlogTitle(data.blogTitle || '');
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchBlog();
    }, [blogUrl, maxPosts]);

    // 블로그 URL이 없거나 에러 시 렌더링하지 않음
    if (!blogUrl || error || (!loading && posts.length === 0)) return null;

    // 날짜 포맷
    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
        } catch {
            return '';
        }
    };

    return (
        <motion.section
            className="mt-20 md:mt-28"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
        >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-8 md:mb-12">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2.5 rounded-2xl",
                        isDark ? "bg-indigo-500/10" : "bg-indigo-50"
                    )}>
                        <Newspaper className={cn("w-5 h-5", isDark ? "text-indigo-400" : "text-indigo-600")} />
                    </div>
                    <div>
                        <h2 className={cn(
                            "text-2xl md:text-3xl font-black tracking-tight",
                            isDark ? "text-white" : "text-slate-900"
                        )}>
                            센터 소식
                        </h2>
                        {blogTitle && (
                            <p className={cn("text-xs font-medium mt-0.5", isDark ? "text-slate-500" : "text-slate-400")}>
                                {blogTitle}
                            </p>
                        )}
                    </div>
                </div>
                <a
                    href={blogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all hover:scale-105",
                        isDark
                            ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                >
                    블로그 전체보기
                    <ExternalLink className="w-3 h-3" />
                </a>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-16">
                    <Loader2 className={cn("w-6 h-6 animate-spin", isDark ? "text-slate-600" : "text-slate-300")} />
                </div>
            )}

            {/* Blog Posts Grid */}
            {!loading && posts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    {posts.map((post, i) => (
                        <motion.a
                            key={post.link}
                            href={post.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                "group block rounded-3xl overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                                isDark
                                    ? "bg-slate-800/60 border-slate-700/60 hover:border-indigo-500/40"
                                    : "bg-white border-slate-100 hover:border-indigo-200"
                            )}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                        >
                            {/* Thumbnail */}
                            {post.thumbnail && (
                                <div className="aspect-[16/9] overflow-hidden">
                                    <img
                                        src={post.thumbnail}
                                        alt={post.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                        onError={(e) => {
                                            // 이미지 로드 실패 시 썸네일 영역 숨김
                                            (e.target as HTMLElement).parentElement!.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}

                            {/* Content */}
                            <div className="p-5 md:p-6">
                                <h3 className={cn(
                                    "font-black text-base md:text-lg leading-tight mb-2 line-clamp-2 transition-colors",
                                    isDark
                                        ? "text-white group-hover:text-indigo-300"
                                        : "text-slate-900 group-hover:text-indigo-600"
                                )}>
                                    {post.title}
                                </h3>
                                <p className={cn(
                                    "text-sm leading-relaxed line-clamp-2 mb-3",
                                    isDark ? "text-slate-400" : "text-slate-500"
                                )}>
                                    {post.description}
                                </p>
                                <div className="flex items-center justify-between">
                                    <time className={cn(
                                        "text-xs font-medium",
                                        isDark ? "text-slate-600" : "text-slate-300"
                                    )}>
                                        {formatDate(post.pubDate)}
                                    </time>
                                    <span className={cn(
                                        "flex items-center gap-1 text-xs font-bold transition-colors",
                                        isDark
                                            ? "text-indigo-400 group-hover:text-indigo-300"
                                            : "text-indigo-500 group-hover:text-indigo-600"
                                    )}>
                                        자세히 보기
                                        <ExternalLink className="w-3 h-3" />
                                    </span>
                                </div>
                            </div>
                        </motion.a>
                    ))}
                </div>
            )}
        </motion.section>
    );
}

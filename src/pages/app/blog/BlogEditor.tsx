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
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save, Globe, Image as ImageIcon, Loader2 } from 'lucide-react';
import { ImageUploader } from '@/components/common/ImageUploader';

// 1. Define Local Interface
interface LocalBlogPost {
    id?: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    content?: string | null;
    cover_image_url?: string | null;
    seo_title?: string | null;
    seo_description?: string | null;
    keywords?: string[] | null;
    is_published?: boolean;
    published_at?: string | null;
    view_count?: number;
    created_at?: string;
    updated_at?: string | null;
    author_id?: string | null;
}

export default function BlogEditor() {
    const { id } = useParams(); // id가 있으면 수정 모드
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!id);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        cover_image_url: '',
        seo_title: '',
        seo_description: '',
        keywords: '', // We treat this as string in UI, convert to array for DB
        is_published: false
    });

    useEffect(() => {
        if (id) {
            fetchPost(id);
        }
    }, [id]);

    const fetchPost = async (postId: string) => {
        // 2. Force Execution with (supabase as any)
        const { data, error } = await (supabase as any)
            .from('blog_posts')
            .select('*')
            .eq('id', postId)
            .single();

        if (error) {
            console.error('Error fetching post:', error);
            alert('게시글을 불러오지 못했습니다.');
            navigate('/app/blog');
        } else {
            setFormData({
                title: data.title,
                slug: data.slug,
                excerpt: data.excerpt || '',
                content: data.content || '',
                cover_image_url: data.cover_image_url || '',
                seo_title: data.seo_title || '',
                seo_description: data.seo_description || '',
                keywords: Array.isArray(data.keywords) ? data.keywords.join(', ') : (data.keywords || ''),
                is_published: data.is_published || false
            });
        }
        setInitialLoading(false);
    };

    // Auto-slug generator
    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9가-힣\s-]/g, '') // 특수문자 제거 (한글, 영문, 숫자, 공백, 하이픈 허용)
            .trim()
            .replace(/\s+/g, '-'); // 공백을 하이픈으로
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        // 새 글 작성일 때만 타이틀 변경시 슬러그 자동 생성
        if (!id) {
            const autoSlug = generateSlug(title);
            setFormData(prev => ({ ...prev, title, slug: autoSlug }));
        } else {
            setFormData(prev => ({ ...prev, title }));
        }
    };

    const generateAIContent = () => {
        const topics = [
            { keyword: 'child therapy', title: 'Why Early Therapy Matters', kor: '아동 심리 치료' },
            { keyword: 'early education', title: 'The Power of Play-Based Learning', kor: '조기 교육의 중요성' },
            { keyword: 'happy family', title: 'Building Stronger Family Bonds', kor: '행복한 가정 만들기' },
            { keyword: 'sensory development', title: 'Understanding Sensory Processing', kor: '감각 발달 이야기' },
            { keyword: 'parenting tips', title: 'Mindful Parenting Strategies', kor: '현명한 부모 되기' }
        ];

        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        const randomId = Math.floor(Math.random() * 10000);
        const imageUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(randomTopic.keyword)}&sig=${randomId}`;

        // 1. Generate Structured Content
        const structuredContent = `
![${randomTopic.keyword}](${imageUrl})

## 🌟 ${randomTopic.title} (${randomTopic.kor})

### 1. Introduction
Start your journey into **${randomTopic.keyword}** today. It plays a crucial role in a child's development.

### 2. Key Benefits
- ✅ **Emotional Growth**: Helps children understand their feelings.
- ✅ **Social Skills**: Improves interaction with peers.
- ✅ **Cognitive Boost**: Enhances problem-solving abilities.

### 3. Practical Tips for Parents
> "Consistency is key. Small steps lead to big changes."

1. Set a routine.
2. Listen actively to your child.
3. Celebrate small wins.

### Conclusion
Remember, every child is unique. Support them with patience and love.

---
*Generated by Zarada AI Assistant*
`.trim();

        // 2. Update Form Data
        setFormData(prev => ({
            ...prev,
            title: prev.title || `${randomTopic.title}: A Guide for Parents`,
            slug: prev.slug || generateSlug(`${randomTopic.title}-${randomId}`),
            cover_image_url: imageUrl,
            excerpt: `Learn about ${randomTopic.keyword} and how it can benefit your family. practical tips included.`,
            content: structuredContent,
            keywords: [randomTopic.keyword, 'parenting', 'child development'].join(', '), // Display as CSV string
            seo_title: `${randomTopic.title} | Zarada ERP`,
            seo_description: `Discover the importance of ${randomTopic.keyword} for your child's growth.`
        }));

        alert(`AI가 '${randomTopic.kor}' 주제로 글 구조와 이미지를 생성했습니다.`);
    };

    const handleSave = async (publish = false) => {
        if (!formData.title || !formData.slug) {
            alert('제목과 URL 슬러그는 필수입니다.');
            return;
        }

        setLoading(true);

        const payload: LocalBlogPost = {
            title: formData.title,
            slug: formData.slug,
            excerpt: formData.excerpt,
            content: formData.content,
            cover_image_url: formData.cover_image_url,
            seo_title: formData.seo_title,
            seo_description: formData.seo_description,
            keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()).filter(k => k) : null,
            is_published: publish,
            published_at: publish ? new Date().toISOString() : null,
            view_count: 0
        };

        let error;

        if (id) {
            const { error: updateError } = await (supabase as any)
                .from('blog_posts')
                .update(payload)
                .eq('id', id);
            error = updateError;
        } else {
            const { error: insertError } = await (supabase as any)
                .from('blog_posts')
                .insert([payload]);
            error = insertError;
        }

        setLoading(false);

        if (error) {
            console.error('Save error:', error);
            alert('저장 중 오류가 발생했습니다: ' + error.message);
        } else {
            alert('저장되었습니다.');
            navigate('/app/blog');
        }
    };

    if (initialLoading) return <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>;

    return (
        <div className="p-8 max-w-5xl mx-auto pb-32">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
                <button onClick={() => navigate('/app/blog')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors">
                    <ArrowLeft className="w-5 h-5" /> 목록으로
                </button>
                <div className="flex gap-3">
                    {/* ✨ AI 이미지 생성 버튼 */}
                    <button
                        onClick={generateAIContent}
                        type="button"
                        className="px-6 py-3 rounded-xl border-2 border-indigo-100 text-indigo-600 font-black hover:bg-indigo-50 transition-all flex items-center gap-2"
                    >
                        <ImageIcon className="w-4 h-4" /> AI 글/이미지 생성 (Beta)
                    </button>

                    <button
                        onClick={() => handleSave(false)}
                        disabled={loading}
                        className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                    >
                        임시 저장
                    </button>
                    <button
                        onClick={() => handleSave(true)}
                        disabled={loading}
                        className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {formData.is_published ? '수정 사항 게시' : '게시글 발행'}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-2">포스트 제목</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={handleTitleChange}
                                className="w-full text-2xl font-black placeholder:text-slate-200 border-none focus:ring-0 p-0"
                                placeholder="여기에 제목을 입력하세요..."
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
                            <Globe className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-400 text-sm font-bold">/blog/</span>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={e => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                                className="flex-1 bg-transparent border-none text-sm font-bold text-slate-600 focus:ring-0 p-0"
                                placeholder="url-slug-example"
                            />
                        </div>
                        <div className="border-t border-slate-100 pt-6">
                            {/* Simple Textarea for now - Can be upgraded to Rich Text Editor */}
                            <label className="block text-sm font-bold text-slate-500 mb-2">본문 내용 (HTML/Markdown)</label>
                            <textarea
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                className="w-full h-[500px] p-4 rounded-2xl border border-slate-200 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y font-medium leading-relaxed"
                                placeholder="# 내용을 작성하세요..."
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-6">
                    {/* Cover Image */}
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-indigo-500" /> 커버 이미지
                        </h3>
                        <ImageUploader
                            currentImage={formData.cover_image_url}
                            onUploadComplete={(url) => setFormData({ ...formData, cover_image_url: url })}
                            bucketName="images" // Assuming 'images' bucket exists
                        />
                    </div>

                    {/* SEO Meta */}
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                        <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
                            SEO 설정
                        </h3>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Meta Title (검색 결과 제목)</label>
                            <input
                                type="text"
                                value={formData.seo_title}
                                onChange={e => setFormData({ ...formData, seo_title: e.target.value })}
                                placeholder={formData.title || "제목과 동일하게 설정 추천"}
                                className="w-full text-sm font-bold border-slate-200 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Meta Description (설명)</label>
                            <textarea
                                value={formData.seo_description}
                                onChange={e => setFormData({ ...formData, seo_description: e.target.value })}
                                rows={3}
                                className="w-full text-sm font-medium border-slate-200 rounded-xl resize-none"
                                placeholder="검색 결과에 표시될 짧은 설명을 작성하세요."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Keywords (쉼표 구분)</label>
                            <input
                                type="text"
                                value={formData.keywords}
                                onChange={e => setFormData({ ...formData, keywords: e.target.value })}
                                className="w-full text-sm font-bold border-slate-200 rounded-xl"
                                placeholder="언어치료, 아동발달, ..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">요약 (카드 표시용)</label>
                            <textarea
                                value={formData.excerpt}
                                onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                                rows={3}
                                className="w-full text-sm font-medium border-slate-200 rounded-xl resize-none"
                                placeholder="블로그 목록 카드에 표시될 짧은 요약입니다."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}

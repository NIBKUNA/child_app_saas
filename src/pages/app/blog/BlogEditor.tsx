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
import { ArrowLeft, Save, Globe, Image as ImageIcon, Loader2, Settings, Brain, X, Plus } from 'lucide-react';
import { ImageUploader } from '@/components/common/ImageUploader';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { CENTER_DEFAULTS } from '@/config/center';

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
    const [showSettings, setShowSettings] = useState(false); // ✨ 생성 설정 모달

    // Settings Hook
    const { getSetting, updateSetting } = useAdminSettings();

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
        // Force Execution with (supabase as any)
        const { data, error } = await (supabase as any)
            .from('blog_posts')
            .select('*')
            .eq('id', postId)
            .maybeSingle();

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

    // Auto-slug generator (Enhanced)
    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9가-힣\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');
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

    // ✨ Smart Alt Tag Image Insertion
    const insertImageToContent = (url: string) => {
        const altTag = `${formData.title || '블로그 이미지'} - ${CENTER_DEFAULTS.name}`;
        const markdownImage = `![${altTag}](${url})`;

        setFormData(prev => ({
            ...prev,
            content: (prev.content || '') + '\n\n' + markdownImage + '\n'
        }));
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
            seo_title: formData.seo_title || formData.title, // Default to title if empty
            seo_description: formData.seo_description || formData.excerpt, // Default to excerpt if empty
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
        <div className="p-8 max-w-6xl mx-auto pb-32">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
                <button onClick={() => navigate('/app/blog')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors">
                    <ArrowLeft className="w-5 h-5" /> 목록으로
                </button>
                <div className="flex gap-3">
                    {/* ✨ AI 설정 버튼 */}
                    <button
                        onClick={() => setShowSettings(true)}
                        className="px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
                    >
                        <Settings className="w-4 h-4" /> AI 설정
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
                        <div className="border-t border-slate-100 pt-6 relative">
                            <label className="block text-sm font-bold text-slate-500 mb-2 flex justify-between">
                                <span>본문 내용 (HTML/Markdown)</span>
                                {/* ✨ 본문 이미지 추가 버튼 */}
                                <div className="relative group">
                                    <label htmlFor="content-image-upload" className="cursor-pointer text-indigo-600 text-xs flex items-center gap-1 hover:underline">
                                        <Plus className="w-3 h-3" /> 본문에 이미지 추가
                                    </label>
                                    <div className="hidden">
                                        <ImageUploader
                                            currentImage={null}
                                            onUploadComplete={insertImageToContent}
                                            bucketName="images"
                                            label="Content Image"
                                        />
                                        {/* Invisible Uploader logic placeholder - in reality, we use the visible one below or custom logic. 
                                            For now, relying on the 'Content Image Helper' below is better UI. */}
                                    </div>
                                </div>
                            </label>

                            <textarea
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                className="w-full h-[600px] p-4 rounded-2xl border border-slate-200 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y font-medium leading-relaxed font-mono text-sm"
                                placeholder="# 내용을 작성하세요..."
                            />
                        </div>
                    </div>

                    {/* ✨ 본문 이미지 삽입 도우미 */}
                    <div className="bg-indigo-50 p-6 rounded-[24px] border border-indigo-100 flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-indigo-900 text-sm mb-1">📸 본문에 이미지 삽입하기</h4>
                            <p className="text-xs text-indigo-600">이미지를 업로드하면 자동으로 <b>SEO 태그({formData.title || '제목'} - {CENTER_DEFAULTS.name})</b>가 적용되어 본문에 추가됩니다.</p>
                        </div>
                        <div className="w-48 bg-white rounded-xl overflow-hidden border border-indigo-100">
                            <div className="p-2">
                                <ImageUploader
                                    currentImage={null}
                                    onUploadComplete={insertImageToContent}
                                    bucketName="images"
                                    label=""
                                />
                            </div>
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
                            bucketName="images"
                        />
                    </div>

                    {/* SEO Meta */}
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                SEO 설정
                            </h3>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Meta Title (검색 결과 제목)</label>
                            <input
                                type="text"
                                value={formData.seo_title}
                                onChange={e => setFormData({ ...formData, seo_title: e.target.value })}
                                placeholder={formData.title || "제목과 동일하게 설정 추천"}
                                className="w-full text-sm font-bold border-slate-200 rounded-xl bg-slate-50 p-3"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Meta Description (설명)</label>
                            <textarea
                                value={formData.seo_description}
                                onChange={e => setFormData({ ...formData, seo_description: e.target.value })}
                                rows={3}
                                className="w-full text-sm font-medium border-slate-200 rounded-xl resize-none bg-slate-50 p-3"
                                placeholder="검색 결과에 표시될 짧은 설명을 작성하세요."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Keywords (쉼표 구분)</label>
                            <input
                                type="text"
                                value={formData.keywords}
                                onChange={e => setFormData({ ...formData, keywords: e.target.value })}
                                className="w-full text-sm font-bold border-slate-200 rounded-xl bg-slate-50 p-3"
                                placeholder="언어치료, 아동발달, ..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">요약 (카드 표시용)</label>
                            <textarea
                                value={formData.excerpt}
                                onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                                rows={3}
                                className="w-full text-sm font-medium border-slate-200 rounded-xl resize-none bg-slate-50 p-3"
                                placeholder="블로그 목록 카드에 표시될 짧은 요약입니다."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ✨ AI Blog Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
                    <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <Brain className="w-6 h-6 text-indigo-600" /> AI 작가 설정
                            </h2>
                            <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-8">
                            <AIGenerator
                                getSetting={getSetting}
                                updateSetting={updateSetting}
                                onGenerate={(content, title) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        title: prev.title || title,
                                        slug: prev.slug || generateSlug(title),
                                        content: content,
                                        is_published: false
                                    }));
                                    setShowSettings(false);
                                    alert('글이 생성되었습니다! 내용을 검토하고 발행하세요.');
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}

// --- ✨ AI Generator Component (Ported from SettingsPage) ---
function AIGenerator({ getSetting, updateSetting, onGenerate }: {
    getSetting: any;
    updateSetting: any;
    onGenerate: (content: string, title: string) => void
}) {
    const [apiKey, setApiKey] = useState(getSetting('openai_api_key'));
    const [topic, setTopic] = useState('');
    const [generating, setGenerating] = useState(false);

    const handleSaveKey = async () => {
        // ✨ [Gemini] AIza 형식 검증
        if (apiKey && !apiKey.startsWith('AIza')) {
            alert('❌ 올바르지 않은 API 키 형식입니다. Google Gemini 키는 "AIza"로 시작해야 합니다.');
            return;
        }
        await updateSetting('openai_api_key', apiKey);
        alert('API 키가 저장되었습니다.');
    };

    const handleGenerate = async () => {
        if (!apiKey) {
            alert('먼저 API 키를 저장해주세요.');
            return;
        }
        if (!topic) {
            alert('주제를 입력해주세요.');
            return;
        }

        setGenerating(true);
        try {
            const systemPrompt = "당신은 20년 경력의 아동 발달 센터 원장입니다. 걱정하는 부모님을 안심시키고 전문가로서 신뢰감 있는 조언을 주는 따뜻한 말투로 글을 작성해주세요.";
            const userPrompt = `
                주제: ${topic}
                센터 이름: ${CENTER_DEFAULTS.name}
                
                조건:
                1. 제목은 매력적으로 첫 줄에 작성 (# 제거).
                2. 의료법 위반 표현(완치, 100% 장담 등) 절대 금지.
                3. 마크다운 형식 사용.
                4. [공감] - [정보3가지] - [안심] 구조로 작성할 것.
                5. 적절한 이모지 사용.
            `;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
                    }]
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                if (response.status === 429) throw new Error("Google AI 사용 한도 초과(429). 잠시 후 다시 시도해주세요.");
                throw new Error(errData.error?.message || `API Error: ${response.status}`);
            }

            const data = await response.json();
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!generatedText) throw new Error("글이 생성되지 않았습니다.");

            const title = generatedText.split('\n')[0].replace(/^#+\s*/, '').replace(/\*/g, '').trim();


            onGenerate(generatedText, title);

        } catch (error: any) {
            console.error(error);
            alert(`생성 실패: ${error.message}`);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6 text-left">
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <label className="block text-sm font-bold text-blue-900 mb-2">Google Gemini API Key</label>
                <div className="flex gap-2">
                    <input
                        type="password"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        className="flex-1 p-3 rounded-xl border border-blue-200 text-sm font-bold"
                        placeholder="AIza..."
                    />
                    <button onClick={handleSaveKey} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm">저장</button>
                </div>
                <p className="text-xs text-blue-600 mt-2">* Google AI Studio에서 무료로 발급 가능</p>
            </div>

            <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">글 주제 (Topic)</label>
                <input
                    type="text"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    className="w-full p-4 rounded-xl border border-slate-200 font-bold"
                    placeholder="예: 우리 아이 언어 발달 늦을 때 대처법"
                />

                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {generating ? <Loader2 className="animate-spin" /> : <Brain />}
                    {generating ? 'AI가 글을 쓰고 있습니다...' : 'AI로 글 생성하기'}
                </button>
            </div>
        </div>
    );
}

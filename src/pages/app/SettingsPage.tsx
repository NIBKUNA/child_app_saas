// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MessageCircle, Bell, LayoutTemplate, Info, BookOpen, Palette, CheckCircle2, Brain, Loader2, X, Receipt, Search, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { useAdminSettings, type AdminSettingKey, type ProgramItem } from '@/hooks/useAdminSettings';
import { ImageUploader } from '@/components/common/ImageUploader';
import { ProgramListEditor } from '@/components/admin/ProgramListEditor';
import { DEFAULT_PROGRAMS } from '@/constants/defaultPrograms';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type TabType = 'home' | 'about' | 'programs' | 'branding' | 'center_info' | 'ai_blog';
const VALID_TABS: TabType[] = ['home', 'about', 'programs', 'branding', 'center_info', 'ai_blog'];

export function SettingsPage() {
    const { settings, getSetting, loading: settingsLoading, fetchSettings } = useAdminSettings();
    const [saving, setSaving] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab') as TabType | null;
    const activeTab: TabType = (tabParam && VALID_TABS.includes(tabParam)) ? tabParam : 'home';

    const setActiveTab = (tab: TabType) => {
        setSearchParams({ tab });
    };

    const handleSave = async (key: AdminSettingKey, value: string | null) => {
        setSaving(true);
        try {
            const finalValue = (value === "" || value === null) ? null : value;
            const { error } = await supabase
                .from('admin_settings')
                .upsert({ key: key, value: finalValue, updated_at: new Date().toISOString() }, { onConflict: 'key' });

            if (error) throw error;
            if (fetchSettings) await fetchSettings();
        } catch (error) {
            console.error('Save Error:', error);
            alert('저장 중 오류 발생: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSavePrograms = async (newList: ProgramItem[]) => {
        setSaving(true);
        try {
            const jsonValue = JSON.stringify(newList);
            await supabase.from('admin_settings').upsert({ key: 'programs_list', value: jsonValue, updated_at: new Date().toISOString() }, { onConflict: 'key' });
            if (fetchSettings) await fetchSettings();
            alert('프로그램 목록이 즉시 반영되었습니다.');
        } catch (error) {
            alert('저장 실패');
        } finally {
            setSaving(false);
        }
    };

    const initialProgramsJson = getSetting('programs_list');
    const programsList: ProgramItem[] = initialProgramsJson ? JSON.parse(initialProgramsJson) : DEFAULT_PROGRAMS;

    if (settingsLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline w-10 h-10 text-slate-300" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4">
            <Helmet><title>사이트 관리</title></Helmet>

            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-black text-slate-900">사이트 콘텐츠 관리</h1>
                <p className="text-slate-500 text-sm">콘텐츠 수정 후 저장 시 즉시 반영됩니다.</p>
            </div>

            <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto custom-scrollbar scrollbar-hide">
                <TabButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<LayoutTemplate className="w-4 h-4" />} label="홈" />
                <TabButton active={activeTab === 'about'} onClick={() => setActiveTab('about')} icon={<Info className="w-4 h-4" />} label="소개" />
                <TabButton active={activeTab === 'programs'} onClick={() => setActiveTab('programs')} icon={<BookOpen className="w-4 h-4" />} label="프로그램" />
                <TabButton active={activeTab === 'branding'} onClick={() => setActiveTab('branding')} icon={<Palette className="w-4 h-4" />} label="로고" />
                <TabButton active={activeTab === 'center_info'} onClick={() => setActiveTab('center_info')} icon={<Info className="w-4 h-4" />} label="정보" />
                <TabButton active={activeTab === 'ai_blog'} onClick={() => setActiveTab('ai_blog')} icon={<Brain className="w-4 h-4" />} label="AI블로그" />
            </div>

            <div className="space-y-10 pt-4">
                {activeTab === 'home' && (
                    <>
                        <SectionCard icon={<MessageCircle className="text-yellow-500" />} title="카카오톡 상담 링크">
                            <SaveableInput label="URL 주소" initialValue={getSetting('kakao_url')} onSave={(v) => handleSave('kakao_url', v)} saving={saving} />
                        </SectionCard>
                        <SectionCard icon={<Bell className="text-blue-500" />} title="메인 상단 공지">
                            <SaveableTextArea label="공지 내용" initialValue={getSetting('notice_text')} onSave={(v) => handleSave('notice_text', v)} saving={saving} />
                        </SectionCard>
                        <SectionCard icon={<LayoutTemplate className="text-purple-500" />} title="배너 이미지">
                            {/* 배너 이미지는 images 버킷 연결 */}
                            <ImageUploader bucketName="images" currentImage={getSetting('main_banner_url')} onUploadComplete={(url) => handleSave('main_banner_url', url)} />
                        </SectionCard>
                    </>
                )}

                {activeTab === 'about' && (
                    <SectionCard title="센터 소개 편집">
                        <SaveableTextArea label="인트로 문구" initialValue={getSetting('about_intro_text')} onSave={(v) => handleSave('about_intro_text', v)} saving={saving} rows={2} />
                        <div className="pt-6 border-t mt-6 space-y-6">
                            {/* 소개 사진은 images 버킷 연결 */}
                            <ImageUploader bucketName="images" label="메인 이미지" currentImage={getSetting('about_main_image')} onUploadComplete={(url) => handleSave('about_main_image', url)} />
                            <SaveableInput label="강조 제목" initialValue={getSetting('about_desc_title')} onSave={(v) => handleSave('about_desc_title', v)} saving={saving} />
                            <SaveableTextArea label="소개 본문" initialValue={getSetting('about_desc_body')} onSave={(v) => handleSave('about_desc_body', v)} saving={saving} rows={5} />
                        </div>
                    </SectionCard>
                )}

                {activeTab === 'programs' && (
                    <SectionCard title="프로그램 리스트">
                        <SaveableTextArea label="페이지 안내" initialValue={getSetting('programs_intro_text')} onSave={(v) => handleSave('programs_intro_text', v)} saving={saving} rows={2} />
                        <div className="mt-8 border-t pt-8">
                            <ProgramListEditor initialList={programsList} onSave={handleSavePrograms} />
                        </div>
                    </SectionCard>
                )}

                {activeTab === 'branding' && (
                    <SectionCard title="로고 및 브랜딩">
                        {/* 로고는 logos 버킷에 전용 연결 */}
                        <ImageUploader bucketName="logos" label="센터 공식 로고" currentImage={getSetting('center_logo')} onUploadComplete={(url) => handleSave('center_logo', url)} />
                    </SectionCard>
                )}

                {activeTab === 'center_info' && <CenterInfoSection />}

                {activeTab === 'ai_blog' && (
                    <SectionCard title="AI 자동 포스팅 및 생성">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 ml-1">요일 선택</label>
                                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={getSetting('ai_posting_day') || 'Monday'} onChange={(e) => handleSave('ai_posting_day', e.target.value)}>
                                    <option value="Monday">월요일</option><option value="Tuesday">화요일</option><option value="Wednesday">수요일</option>
                                    <option value="Thursday">목요일</option><option value="Friday">금요일</option><option value="Saturday">토요일</option><option value="Sunday">일요일</option>
                                </select>
                            </div>
                            <SaveableInput label="시간 (HH:MM)" initialValue={getSetting('ai_posting_time')} onSave={(v) => handleSave('ai_posting_time', v)} saving={saving} />
                        </div>
                        <div className="mt-6 pb-8 border-b">
                            <SaveableTextArea label="다음 주제 키워드" initialValue={getSetting('ai_next_topic')} onSave={(v) => handleSave('ai_next_topic', v)} saving={saving} rows={2} />
                        </div>

                        <AIBlogGenerateButton />
                    </SectionCard>
                )}
            </div>
        </div>
    );
}

// --- AI 블로그 수동 생성 버튼 컴포넌트 (로딩 버그 해결) ---
const AI_GENERATING_KEY = 'ai_blog_generating';
const AI_GENERATION_START_KEY = 'ai_blog_generation_start';

function AIBlogGenerateButton() {
    const [generating, setGenerating] = useState(() => {
        const isGen = localStorage.getItem(AI_GENERATING_KEY) === 'true';
        const startTime = localStorage.getItem(AI_GENERATION_START_KEY);
        if (isGen && startTime && (Date.now() - parseInt(startTime, 10) > 180000)) { // 타임아웃 3분으로 연장
            localStorage.removeItem(AI_GENERATING_KEY);
            localStorage.removeItem(AI_GENERATION_START_KEY);
            return false;
        }
        return isGen;
    });
    const [result, setResult] = useState(null);

    useEffect(() => {
        if (!generating) return;
        const checkForNewPost = async () => {
            try {
                const { data } = await supabase.from('posts').select('title, created_at').order('created_at', { ascending: false }).limit(1).single();
                if (data) {
                    const startTimeStr = localStorage.getItem(AI_GENERATION_START_KEY);
                    if (startTimeStr && new Date(data.created_at) > new Date(parseInt(startTimeStr, 10))) {
                        finishLoading(`✅ 생성이 완료되었습니다: "${data.title}"`);
                    }
                }
            } catch (err) { }
        };
        const interval = setInterval(checkForNewPost, 5000);
        return () => clearInterval(interval);
    }, [generating]);

    const finishLoading = (msg) => {
        setGenerating(false);
        localStorage.removeItem(AI_GENERATING_KEY);
        localStorage.removeItem(AI_GENERATION_START_KEY);
        setResult({ success: true, message: msg });
    };

    const handleGenerate = async () => {
        if (generating) return;
        setGenerating(true);
        localStorage.setItem(AI_GENERATING_KEY, 'true');
        localStorage.setItem(AI_GENERATION_START_KEY, String(Date.now()));
        setResult(null);

        try {
            // Edge Function 호출
            const { data, error } = await supabase.functions.invoke('generate-blog-post', { body: {} });

            // 응답을 받으면 폴링을 기다리지 않고 즉시 로딩 종료 시도 (네트워크 지연 방지)
            if (data && !data.error) {
                finishLoading(`✅ 발행 요청이 성공했습니다. 잠시 후 글이 등록됩니다.`);
            } else if (error || data?.error) {
                throw new Error(error?.message || data?.error);
            }
        } catch (err) {
            setResult({ success: false, message: `❌ 오류: ${err.message}` });
            setGenerating(false);
            localStorage.removeItem(AI_GENERATING_KEY);
            localStorage.removeItem(AI_GENERATION_START_KEY);
        }
    };

    return (
        <div className="mt-8 space-y-4 text-left">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-slate-900">수동 포스팅 실행</h3>
                    <p className="text-sm text-slate-500 font-medium">지금 즉시 AI가 주제를 분석하고 글을 작성하여 발행합니다.</p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className={cn(
                        "px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 transition-all",
                        generating ? "bg-indigo-100 text-indigo-400 cursor-wait" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-95"
                    )}
                >
                    {generating ? <Loader2 className="animate-spin w-4 h-4" /> : <Brain className="w-4 h-4" />}
                    {generating ? "AI가 집필 중... (잠시만 기다려주세요)" : "지금 생성 및 발행하기"}
                </button>
            </div>
            {result && (
                <div className={cn("p-4 rounded-xl text-sm font-bold border animate-in fade-in slide-in-from-top-2",
                    result.success ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100")}>
                    {result.message}
                </div>
            )}
        </div>
    );
}

function CenterInfoSection() {
    const [info, setInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchCenter = async () => {
        setLoading(true);
        const { data: user } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('user_profiles').select('center_id').eq('id', user.user?.id).single();
        let cId = profile?.center_id || (await supabase.from('centers').select('id').limit(1).single()).data?.id;
        if (cId) {
            const { data } = await supabase.from('centers').select('*').eq('id', cId).single();
            setInfo(data);
        }
        setLoading(false);
    };

    useEffect(() => { fetchCenter(); }, []);

    const handleInfoSave = async (key: string, value: string) => {
        if (!info?.id) return;
        setSaving(true);
        const finalValue = value === "" ? null : value;
        const { data, error } = await supabase.from('centers').update({ [key]: finalValue }).eq('id', info.id).select();
        if (!error && data) setInfo(data[0]);
        setSaving(false);
    };

    if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline" /></div>;

    return (
        <SectionCard title="센터 행정 정보">
            <div className="space-y-6">
                <SaveableInput label="센터 이름" initialValue={info.name} onSave={(v) => handleInfoSave('name', v)} saving={saving} />
                <SaveableInput label="연락처" initialValue={info.phone} onSave={(v) => handleInfoSave('phone', v)} saving={saving} />
                <SaveableInput label="주소" initialValue={info.address} onSave={(v) => handleInfoSave('address', v)} saving={saving} />
                <SaveableInput label="지도 URL" initialValue={info.naver_map_url} onSave={(v) => handleInfoSave('naver_map_url', v)} saving={saving} />
            </div>
        </SectionCard>
    );
}

function SectionCard({ icon, title, children }) {
    return (
        <section className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm transition-all hover:shadow-md text-left">
            <div className="flex items-center gap-3 mb-8">
                {icon}
                <h2 className="text-xl font-black text-slate-800 tracking-tight">{title}</h2>
            </div>
            {children}
        </section>
    );
}

function TabButton({ active, onClick, icon, label }) {
    return (
        <button onClick={onClick} className={cn("flex items-center gap-2 px-6 py-5 font-bold text-sm transition-all border-b-4 whitespace-nowrap", active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600")}>
            {icon} {label}
        </button>
    );
}

function SaveableInput({ label, initialValue, onSave, saving, placeholder }) {
    const [value, setValue] = useState(initialValue || '');
    useEffect(() => { setValue(initialValue || ''); }, [initialValue]);
    const isChanged = value !== (initialValue || '');
    return (
        <div className="w-full text-left">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">{label}</label>
            <div className="flex gap-3">
                <input type="text" value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder} className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 transition-all" />
                <button onClick={() => onSave(value)} disabled={!isChanged || saving} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm disabled:opacity-20 flex items-center gap-2 active:scale-95 transition-all">
                    {saving ? <Loader2 className="animate-spin w-4 h-4" /> : '저장'}
                </button>
            </div>
        </div>
    );
}

function SaveableTextArea({ label, initialValue, onSave, saving, placeholder, rows = 3 }) {
    const [value, setValue] = useState(initialValue || '');
    useEffect(() => { setValue(initialValue || ''); }, [initialValue]);
    const isChanged = value !== (initialValue || '');
    return (
        <div className="w-full text-left">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">{label}</label>
            <div className="space-y-4">
                <textarea value={value} onChange={e => setValue(e.target.value)} rows={rows} placeholder={placeholder} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[28px] focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 transition-all resize-none" />
                <div className="flex justify-end">
                    <button onClick={() => onSave(value)} disabled={!isChanged || saving} className="px-10 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm disabled:opacity-20 flex items-center gap-2 active:scale-95 transition-all">
                        {saving ? <Loader2 className="animate-spin w-4 h-4" /> : '변경사항 저장'}
                    </button>
                </div>
            </div>
        </div>
    );
}
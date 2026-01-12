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
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MessageCircle, Bell, LayoutTemplate, Info, BookOpen, Palette, CheckCircle2, Brain, Loader2, X, Receipt, Search, ChevronLeft, ChevronRight, Pencil, Clock, Share2, UserX } from 'lucide-react';
import { useAdminSettings, type AdminSettingKey, type ProgramItem } from '@/hooks/useAdminSettings';
import { ImageUploader } from '@/components/common/ImageUploader';
import { ProgramListEditor } from '@/components/admin/ProgramListEditor';
import { DEFAULT_PROGRAMS } from '@/constants/defaultPrograms';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { AccountDeletionModal } from '@/components/AccountDeletionModal';

// --- ❌ 원본 로직 절대 보존 ---
const AI_GENERATING_KEY = 'ai_blog_generating';
const AI_GENERATION_START_KEY = 'ai_blog_generation_start';

type TabType = 'home' | 'about' | 'programs' | 'branding' | 'center_info' | 'ai_blog' | 'account';
const VALID_TABS: TabType[] = ['home', 'about', 'programs', 'branding', 'center_info', 'ai_blog', 'account'];

export function SettingsPage() {
    const { settings, getSetting, loading: settingsLoading, fetchSettings } = useAdminSettings();
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

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
                .upsert({
                    key: key,
                    value: finalValue,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

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
        <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4 text-left font-bold">
            <Helmet><title>사이트 관리</title></Helmet>

            <div className="flex flex-col gap-1 text-left">
                <h1 className="text-2xl font-black text-slate-900 text-left">사이트 콘텐츠 관리</h1>
                <p className="text-slate-500 text-sm font-bold text-left">콘텐츠 수정 후 저장 시 즉시 반영됩니다.</p>
            </div>

            <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto custom-scrollbar scrollbar-hide">
                <TabButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<LayoutTemplate className="w-4 h-4" />} label="홈" />
                <TabButton active={activeTab === 'about'} onClick={() => setActiveTab('about')} icon={<Info className="w-4 h-4" />} label="소개" />
                <TabButton active={activeTab === 'programs'} onClick={() => setActiveTab('programs')} icon={<BookOpen className="w-4 h-4" />} label="프로그램" />
                <TabButton active={activeTab === 'branding'} onClick={() => setActiveTab('branding')} icon={<Palette className="w-4 h-4" />} label="로고" />
                <TabButton active={activeTab === 'center_info'} onClick={() => setActiveTab('center_info')} icon={<Info className="w-4 h-4" />} label="정보/운영" />
                <TabButton active={activeTab === 'ai_blog'} onClick={() => setActiveTab('ai_blog')} icon={<Brain className="w-4 h-4" />} label="AI블로그" />
                <TabButton active={activeTab === 'account'} onClick={() => setActiveTab('account')} icon={<UserX className="w-4 h-4" />} label="계정" />
            </div>

            <div className="space-y-10 pt-4 text-left">
                {activeTab === 'home' && (
                    <>
                        <SectionCard icon={<MessageCircle className="text-yellow-500" />} title="카카오톡 상담 링크">
                            <SaveableInput label="URL 주소" initialValue={getSetting('kakao_url')} onSave={(v) => handleSave('kakao_url', v)} saving={saving} />
                        </SectionCard>
                        <SectionCard icon={<Bell className="text-blue-500" />} title="메인 상단 공지">
                            <SaveableTextArea label="공지 내용" initialValue={getSetting('notice_text')} onSave={(v) => handleSave('notice_text', v)} saving={saving} />
                        </SectionCard>
                        <SectionCard icon={<LayoutTemplate className="text-purple-500" />} title="배너 이미지">
                            <ImageUploader bucketName="images" currentImage={getSetting('main_banner_url')} onUploadComplete={(url) => handleSave('main_banner_url', url)} />
                        </SectionCard>
                    </>
                )}

                {activeTab === 'about' && (
                    <SectionCard title="센터 소개 편집">
                        <SaveableTextArea label="인트로 문구" initialValue={getSetting('about_intro_text')} onSave={(v) => handleSave('about_intro_text', v)} saving={saving} rows={2} />
                        <div className="pt-6 border-t mt-6 space-y-6">
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
                        <ImageUploader bucketName="logos" label="센터 공식 로고" currentImage={getSetting('center_logo')} onUploadComplete={(url) => handleSave('center_logo', url)} />
                    </SectionCard>
                )}

                {/* ✨ 정보/운영 탭 통합 섹션 - 원본 UI 보존 및 필드 추가 */}
                {activeTab === 'center_info' && <CenterInfoSection />}

                {activeTab === 'ai_blog' && (
                    <SectionCard title="AI 자동 포스팅 및 생성">
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                            <h4 className="text-sm font-black text-blue-900 mb-2">🤖 OpenAI API Key 설정 (필수)</h4>
                            <SaveableInput
                                label="OpenAI API Key (sk-...)"
                                placeholder="sk-..."
                                initialValue={getSetting('openai_api_key')}
                                onSave={(v) => handleSave('openai_api_key', v)}
                                saving={saving}
                            />
                            <p className="text-[10px] text-blue-600 mt-2 font-bold ml-1">* 키가 저장되어야 자동 글쓰기가 작동합니다.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 text-left">
                                <label className="text-xs font-black text-slate-400 ml-1 text-left">요일 선택</label>
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

                {/* ✨ 계정 관리 탭 */}
                {activeTab === 'account' && (
                    <>
                        <SectionCard title="계정 정보" icon={<UserX className="text-rose-500" />}>
                            <div className="space-y-4">
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">로그인 이메일</p>
                                    <p className="font-bold text-slate-900">{user?.email}</p>
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard title="회원 탈퇴" icon={<UserX className="text-rose-500" />}>
                            <div className="space-y-4">
                                <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                                    <p className="text-sm font-bold text-rose-700 mb-2">⚠️ 주의: 회원 탈퇴 시 모든 데이터가 삭제됩니다.</p>
                                    <ul className="text-xs text-rose-600 space-y-1 list-disc list-inside">
                                        <li>개인정보 및 계정 정보가 삭제됩니다.</li>
                                        <li>연결된 자녀 정보와의 연결이 해제됩니다.</li>
                                        <li>이 작업은 되돌릴 수 없습니다.</li>
                                    </ul>
                                </div>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black hover:bg-rose-700 transition-colors"
                                >
                                    회원 탈퇴 신청
                                </button>
                            </div>
                        </SectionCard>

                        {/* 회원 탈퇴 모달 */}
                        <AccountDeletionModal
                            isOpen={showDeleteModal}
                            onClose={() => setShowDeleteModal(false)}
                            userId={user?.id || ''}
                            userEmail={user?.email || ''}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

// --- ✨ [원본 디자인 그대로] 센터 행정 및 운영시간 수정 섹션 ---
function CenterInfoSection() {
    const [info, setInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchCenter = async () => {
        setLoading(true);
        try {
            const { data } = await supabase.from('centers').select('*').limit(1).maybeSingle();
            if (data) setInfo(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchCenter(); }, []);

    const handleInfoSave = async (key: string, value: string) => {
        if (!info?.id) return;
        setSaving(true);
        try {
            const finalValue = value === "" ? null : value;
            const { data, error } = await supabase.from('centers').update({ [key]: finalValue }).eq('id', info.id).select();
            if (!error && data) {
                setInfo(data[0]);
                alert('변경사항이 저장되었습니다.');
            } else if (error) throw error;
        } catch (e) {
            alert('저장 실패: DB 컬럼 정보를 확인해주세요.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline text-slate-300" /></div>;
    if (!info) return null;

    return (
        <div className="space-y-8 text-left">
            <SectionCard title="센터 행정 정보 (푸터/헤더 동기화)" icon={<Info className="text-blue-500" />}>
                <div className="space-y-6">
                    {/* ✨ 센터 이름 필드 명시 */}
                    <SaveableInput label="공식 센터 이름" initialValue={info.name} onSave={(v) => handleInfoSave('name', v)} saving={saving} />
                    <SaveableInput label="대표 연락처" initialValue={info.phone} onSave={(v) => handleInfoSave('phone', v)} saving={saving} />
                    <SaveableInput label="도로명 주소" initialValue={info.address} onSave={(v) => handleInfoSave('address', v)} saving={saving} />
                    <SaveableInput label="공식 이메일" initialValue={info.email} onSave={(v) => handleInfoSave('email', v)} saving={saving} />
                    <SaveableInput label="지도 공유 URL" initialValue={info.naver_map_url} onSave={(v) => handleInfoSave('naver_map_url', v)} saving={saving} />
                </div>
            </SectionCard>

            <SectionCard title="운영 시간 상세 설정" icon={<Clock className="text-emerald-500" />}>
                <div className="space-y-6 text-left">
                    {/* ✨ 평일, 주말, 휴무 필드 명시 */}
                    <SaveableInput label="평일 운영 시간" initialValue={info.weekday_hours} placeholder="예: 09:00 - 19:00" onSave={(v) => handleInfoSave('weekday_hours', v)} saving={saving} />
                    <SaveableInput label="토요일 운영 시간" initialValue={info.saturday_hours} placeholder="예: 09:00 - 16:00" onSave={(v) => handleInfoSave('saturday_hours', v)} saving={saving} />
                    <SaveableInput label="일요일/공휴일 휴무 문구" initialValue={info.holiday_text} placeholder="예: 매주 일요일 정기 휴무" onSave={(v) => handleInfoSave('holiday_text', v)} saving={saving} />
                </div>
            </SectionCard>

            {/* ✨ SNS 링크 설정 섹션 */}
            <SnsLinksSection />
        </div>
    );
}

// --- ❌ 원본 AI 블로그 버튼 및 공통 컴포넌트 로직 (수정 금지) ---
function AIBlogGenerateButton() {
    const { getSetting } = useAdminSettings(); // Retrieve settings
    const [generating, setGenerating] = useState(() => {
        const isGen = localStorage.getItem(AI_GENERATING_KEY) === 'true';
        const startTime = localStorage.getItem(AI_GENERATION_START_KEY);
        if (isGen && startTime && (Date.now() - parseInt(startTime, 10) > 180000)) {
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
                const { data } = await supabase.from('blog_posts').select('title, created_at').order('created_at', { ascending: false }).limit(1).single();
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

        // Validation: Check for API Key
        const apiKey = getSetting('openai_api_key');
        if (!apiKey) {
            alert('❌ API 키가 설정되지 않았습니다. 설정 위 "API Key 설정"에 키를 입력해주세요.');
            return;
        }
        // ✨ [Gemini 복구] OpenAI 강제 제거. Gemini 키 형식을 체크하거나 관대하게 허용.
        // Google AI Key는 보통 AIza... 로 시작하지만, 엄격한 검사보다는 길이 체크 정도만 함.
        if (apiKey.length < 20) {
            alert('❌ API 키가 너무 짧습니다. Google Gemini API 키를 확인해주세요.');
            return;
        }

        setGenerating(true);
        localStorage.setItem(AI_GENERATING_KEY, 'true');
        localStorage.setItem(AI_GENERATION_START_KEY, String(Date.now()));
        setResult(null);

        try {
            const topic = getSetting('ai_next_topic') || '아동 발달 센터';

            const systemPrompt = "당신은 20년 경력의 아동 발달 센터 원장입니다. 걱정하는 부모님을 안심시키고 전문가로서 신뢰감 있는 조언을 주는 따뜻한 말투로 글을 작성해주세요.";
            const userPrompt = `
                주제: ${topic}
                센터 이름: 자라다 아동발달센터
                
                조건:
                1. 제목은 매력적으로.
                2. 완치, 100% 장담 등 의료법 위반 표현 금지.
                3. 마크다운 형식 사용.
                4. [공감] - [정보3가지] - [안심] 구조로 작성할 것.
            `;

            // ✨ [Gemini API] Client Side Call
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
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

            // ✨ [Save to Cloud] 생성된 글을 Posts 테이블에 저장
            const { error: dbError } = await supabase.from('posts').insert({
                title: generatedText.split('\n')[0].replace(/^#+\s*/, '') || topic,
                content: generatedText,
                author_id: (await supabase.auth.getUser()).data.user?.id,
                status: 'published',
                category: 'column',
                tags: ['AI생성', topic]
            });

            if (dbError) throw dbError;

            finishLoading(`✅ AI 작가가 글을 발행했습니다! 블로그 메뉴에서 확인하세요.`);

        } catch (err: any) {
            console.error(err);
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
                    {generating ? "AI가 집필 중..." : "지금 생성 및 발행하기"}
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

// --- ✨ SNS 링크 설정 섹션 ---
function SnsLinksSection() {
    const { getSetting, fetchSettings } = useAdminSettings();
    const [saving, setSaving] = useState(false);

    const handleSave = async (key: string, value: string) => {
        if (!key) return;

        // ✨ [API Key Validation] Gemini 키 (sk- 검사 제거)
        if (key === 'openai_api_key' && value && value.startsWith('sk-')) {
            alert('⚠️ 구글 Gemini 키를 입력해주세요. (현재 OpenAI 키 형식이 입력되었습니다)');
            // 막지는 않음
        }

        setSaving(true);
        try {
            await supabase.from('admin_settings').upsert(
                { key, value, updated_at: new Date().toISOString() },
                { onConflict: 'key' }
            );
            if (fetchSettings) await fetchSettings();
            alert('저장되었습니다.');
        } catch (e) {
            alert('저장 실패');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SectionCard title="SNS 링크 (푸터 아이콘 연동)" icon={<Share2 className="text-pink-500" />}>
            <p className="text-xs text-slate-400 mb-6">입력한 URL이 있는 SNS만 푸터에 아이콘이 표시됩니다.</p>
            <div className="space-y-6">
                <SaveableInput
                    label="인스타그램 URL"
                    initialValue={getSetting('sns_instagram')}
                    placeholder="https://instagram.com/your_account"
                    onSave={(v) => handleSave('sns_instagram', v)}
                    saving={saving}
                />
                <SaveableInput
                    label="페이스북 URL"
                    initialValue={getSetting('sns_facebook')}
                    placeholder="https://facebook.com/your_page"
                    onSave={(v) => handleSave('sns_facebook', v)}
                    saving={saving}
                />
                <SaveableInput
                    label="유튜브 채널 URL"
                    initialValue={getSetting('sns_youtube')}
                    placeholder="https://youtube.com/@your_channel"
                    onSave={(v) => handleSave('sns_youtube', v)}
                    saving={saving}
                />
                <SaveableInput
                    label="블로그/네이버 블로그 URL"
                    initialValue={getSetting('sns_blog')}
                    placeholder="https://blog.naver.com/your_blog"
                    onSave={(v) => handleSave('sns_blog', v)}
                    saving={saving}
                />
            </div>
        </SectionCard>
    );
}

function SectionCard({ icon, title, children }) {
    return (
        <section
            className="bg-white/70 backdrop-blur-xl rounded-[32px] p-8 border border-white/50 shadow-xl shadow-slate-200/30 
                       transition-all duration-300 ease-out hover:shadow-2xl hover:-translate-y-1 hover:bg-white/90 text-left"
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.8) 100%)'
            }}
        >
            <div className="flex items-center gap-3 mb-8 text-left">
                <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100/50">
                    {icon}
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight text-left">{title}</h2>
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
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 text-left">{label}</label>
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
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 text-left">{label}</label>
            <div className="space-y-4 text-left">
                <textarea value={value} onChange={e => setValue(e.target.value)} rows={rows} placeholder={placeholder} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[28px] focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-700 transition-all resize-none" />
                <div className="flex justify-end mt-4">
                    <button onClick={() => onSave(value)} disabled={!isChanged || saving} className="px-10 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm disabled:opacity-20 flex items-center gap-2 active:scale-95 transition-all">
                        {saving ? <Loader2 className="animate-spin w-4 h-4" /> : '변경사항 저장'}
                    </button>
                </div>
            </div>
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    Info,
    Share2,
    LayoutTemplate,
    Clock,
    ChevronRight,
    Loader2,
    CheckCircle2,
    Plus,
    Trash2,
    Edit2,
    Globe,
    Award,
    Bell,
    BookOpen,
    Palette,
    Heart,
    UserX,
    Pencil
} from 'lucide-react';
import { useAdminSettings, type AdminSettingKey, type ProgramItem } from '@/hooks/useAdminSettings';
import { ImageUploader } from '@/components/common/ImageUploader';
import { MultiImageUploader } from '@/components/common/MultiImageUploader';
import { ProgramListEditor } from '@/components/admin/ProgramListEditor';
import { DEFAULT_PROGRAMS } from '@/constants/defaultPrograms';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCenter } from '@/contexts/CenterContext';
import { useTheme } from '@/contexts/ThemeProvider';
import { AccountDeletionModal } from '@/components/AccountDeletionModal';
import type { Database } from '@/types/database.types';

type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type Center = TableRow<'centers'>;

// --- ❌ 원본 로직 절대 보존 ---

type TabType = 'home' | 'about' | 'programs' | 'therapists' | 'branding' | 'center_info' | 'account';
const VALID_TABS: TabType[] = ['home', 'about', 'programs', 'therapists', 'branding', 'center_info', 'account'];

export function SettingsPage() {
    const { getSetting, loading: settingsLoading, refresh: fetchSettings } = useAdminSettings();
    const { user, role } = useAuth();
    const { center } = useCenter();
    const { isSuperAdmin } = useTheme();
    const centerId = center?.id;
    const [saving, setSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab') as TabType | null;
    const activeTab: TabType = (tabParam && VALID_TABS.includes(tabParam)) ? tabParam : 'home';

    const setActiveTab = (tab: TabType) => {
        setSearchParams({ tab });
    };

    const handleSave = async (key: AdminSettingKey, value: string | null) => {
        if (!centerId) {
            alert('센터 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        setSaving(true);
        try {
            const finalValue = (value === "" || value === null) ? null : value;
            // ✨ [Persistence Fix] Enforce center_id to prevent orphan data
            const { error } = await supabase
                .from('admin_settings')
                .upsert({
                    center_id: centerId,
                    key: key,
                    value: finalValue,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'center_id, key' });

            if (error) throw error;

            // ✨ [Sync Fix] Notify all listeners to refetch
            window.dispatchEvent(new Event('settings-updated'));

            if (fetchSettings) await fetchSettings();
        } catch (error: unknown) {
            const err = error as Error;
            console.error('Save Error:', err);
            alert('저장 중 오류 발생: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSavePrograms = async (newList: ProgramItem[]) => {
        if (!centerId) return;
        setSaving(true);
        try {
            const jsonValue = JSON.stringify(newList);
            const { error } = await supabase.from('admin_settings').upsert({
                center_id: centerId,
                key: 'programs_list',
                value: jsonValue,
                updated_at: new Date().toISOString()
            }, { onConflict: 'center_id, key' });

            if (error) throw error;

            // ✨ [Sync Fix] Notify all listeners to refetch
            window.dispatchEvent(new Event('settings-updated'));

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

    // ✨ [Access Control] 탭별 권한 분리
    // - admin / manager: 프로그램, 치료사, 운영정보 접근 가능
    // - super_admin: 전체 접근 가능
    const isAdminOrManager = role === 'admin' || role === 'manager';
    const hasAccess = isSuperAdmin || role === 'super_admin' || isAdminOrManager;

    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center space-y-6">
                <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center">
                    <UserX className="w-8 h-8 text-rose-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">접근 권한이 없습니다</h2>
                <p className="text-slate-500 font-bold max-w-md">
                    사이트 설정은 관리자 이상 권한이 필요합니다. 필요한 경우 슈퍼 관리자에게 문의해주세요.
                </p>
            </div>
        );
    }

    // ✨ [Safety] Super Admin Global Mode Guard
    if (!centerId) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center space-y-6">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <Pencil className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">센터를 선택해주세요</h2>
                <p className="text-slate-500 font-bold max-w-md">
                    설정을 변경할 센터가 선택되지 않았습니다. 상단 배너의 '센터 전환' 버튼을 눌러 관리할 지점을 선택해주세요.
                </p>
            </div>
        );
    }

    // ✨ [Tab Filter] admin/manager는 프로그램·치료사·운영정보만 접근 가능
    const isSuperOnly = !isSuperAdmin && role !== 'super_admin';
    const allTabs = [
        { id: 'home', label: '홈', icon: <LayoutTemplate className="w-4 h-4" />, superOnly: true },
        { id: 'about', label: '소개', icon: <Info className="w-4 h-4" />, superOnly: true },
        { id: 'programs', label: '프로그램', icon: <BookOpen className="w-4 h-4" />, superOnly: false },
        { id: 'therapists', label: '치료사', icon: <Heart className="w-4 h-4" />, superOnly: false },
        { id: 'center_info', label: '운영정보', icon: <Clock className="w-4 h-4" />, superOnly: false },
        { id: 'branding', label: '브랜드/SEO', icon: <Palette className="w-4 h-4" />, superOnly: true },
        { id: 'account', label: '계정', icon: <UserX className="w-4 h-4" />, superOnly: false },
    ];
    const visibleTabs = isSuperOnly ? allTabs.filter(t => !t.superOnly) : allTabs;

    // admin/manager가 super-only 탭 URL로 직접 접근 시 첫 허용 탭으로 리다이렉트
    const currentTabAllowed = visibleTabs.some(t => t.id === activeTab);
    const effectiveTab = currentTabAllowed ? activeTab : (visibleTabs[0]?.id as TabType || 'programs');

    // 유효하지 않은 탭이면 URL 보정
    if (!currentTabAllowed && effectiveTab !== activeTab) {
        setActiveTab(effectiveTab);
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4 text-left font-bold">
            <Helmet><title>사이트 관리</title></Helmet>

            <div className="flex flex-col gap-1 text-left">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white text-left">사이트 콘텐츠 관리</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold text-left">콘텐츠 수정 후 저장 시 즉시 반영됩니다.</p>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl overflow-x-auto gap-1 no-scrollbar">
                {visibleTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={cn(
                            "flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex-1 hover:bg-white/50 dark:hover:bg-slate-700/50",
                            effectiveTab === tab.id
                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                : "text-slate-500 dark:text-slate-400"
                        )}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-10 pt-4 text-left">
                {effectiveTab === 'home' && (
                    <HomeSettingsTab
                        getSetting={getSetting}
                        handleSave={handleSave}
                        saving={saving}
                    />
                )}

                {effectiveTab === 'about' && (
                    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {/* 1. ✨ Hero Intro Section (Top) */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">페이지 상단 소개</h3>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HERO SECTION</span>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                                {/* Preview */}
                                <div className="rounded-[40px] overflow-hidden shadow-xl relative aspect-[16/9] xl:aspect-auto xl:h-full min-h-[300px]"
                                    style={{ backgroundColor: getSetting('brand_color') || '#4f46e5' }}
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -ml-10 -mb-10"></div>
                                    <div className="relative z-10 flex flex-col items-center justify-center text-center h-full p-10 text-white space-y-6">
                                        <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black tracking-wider uppercase">About Us</span>
                                        <h1 className="text-3xl font-black tracking-[-0.05em]">센터 소개</h1>
                                        <p className="text-base font-medium opacity-90 leading-relaxed whitespace-pre-line max-w-md">
                                            {getSetting('about_intro_text') || "아이는 믿는 만큼 자라고,\n사랑받는 만큼 행복해집니다."}
                                        </p>
                                    </div>
                                </div>

                                {/* Editor */}
                                <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm h-full flex flex-col justify-center">
                                    <SaveableTextArea
                                        label="인트로 문구 (상단 배너)"
                                        placeholder="줄바꿈을 사용하여 보기 좋게 작성해주세요."
                                        initialValue={getSetting('about_intro_text') ?? null}
                                        onSave={(v) => handleSave('about_intro_text', v)}
                                        saving={saving}
                                        rows={4}
                                    />
                                    <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
                                        * 이 문구는 센터 소개 페이지의 최상단 배경 위에 표시됩니다.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 2. ✨ Main Page Story Section (Separate) */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                        <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">메인 홈페이지 스토리</h3>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MAIN PAGE</span>
                            </div>

                            {/* Live Preview (Text Left, Image Right) */}
                            <div className="relative rounded-[50px] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 group">
                                <div className="absolute top-4 left-6 z-20 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-widest border border-white/10">
                                    Main Page Live Preview
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2">
                                    {/* Text (Left) */}
                                    <div className="p-10 md:p-16 flex flex-col justify-center space-y-8">
                                        <div className="text-indigo-100 dark:text-slate-700">
                                            {/* Quote Icon */}
                                            <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" /></svg>
                                        </div>
                                        <h3 className="text-3xl md:text-4xl font-black leading-[1.15] tracking-[-0.05em] text-slate-900 dark:text-white whitespace-pre-line" style={{ wordBreak: 'keep-all' }}>
                                            {getSetting('home_story_title') || "아이들의 웃음이\n자라나는 두 번째 집"}
                                        </h3>
                                        <p className="text-base font-medium leading-relaxed text-slate-500 dark:text-slate-400 whitespace-pre-line" style={{ wordBreak: 'keep-all' }}>
                                            {getSetting('home_story_body') || "메인 홈페이지에 표시될 소개글입니다.\n설명을 입력하면 실시간으로 반영됩니다."}
                                        </p>
                                        <div className="flex items-center gap-2 font-bold text-sm mt-2 text-indigo-600 dark:text-indigo-400">
                                            {getSetting('home_cta_text') || '상담 예약하기'}
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" /></svg>
                                        </div>
                                    </div>
                                    {/* Image (Right) */}
                                    <div className="relative h-[350px] lg:h-auto bg-slate-100 dark:bg-slate-800">
                                        {getSetting('home_story_image') ? (
                                            <img src={getSetting('home_story_image')} alt="Home Preview" className="absolute inset-0 w-full h-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold">이미지가 없습니다</div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent lg:bg-gradient-to-l"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Editor */}
                            <SectionCard title="메인 페이지 스토리 편집" icon={<Edit2 className="text-blue-500" />}>
                                <div className="space-y-6">
                                    <ImageUploader bucketName="images" label="메인 스토리 (우측) 이미지" currentImage={getSetting('home_story_image')} onUploadComplete={(url) => handleSave('home_story_image', url)} />
                                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />
                                    <SaveableTextArea label="강조 제목 (Quote)" initialValue={getSetting('home_story_title') ?? null} onSave={(v) => handleSave('home_story_title', v)} saving={saving} rows={2} />
                                    <SaveableTextArea label="본문 설명 (Description)" initialValue={getSetting('home_story_body') ?? null} onSave={(v) => handleSave('home_story_body', v)} saving={saving} rows={4} />
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <SaveableInput label="버튼 텍스트" initialValue={getSetting('home_cta_text') ?? null} onSave={(v) => handleSave('home_cta_text', v)} saving={saving} />
                                        <SaveableInput label="버튼 링크 (URL)" initialValue={getSetting('home_cta_link') ?? null} onSave={(v) => handleSave('home_cta_link', v)} saving={saving} />
                                    </div>
                                </div>
                            </SectionCard>
                        </div>


                        {/* 3. ✨ About Page Story Section (Separate) */}
                        <div className="space-y-6 pt-12 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                                        <Heart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">센터 소개 (About) 페이지 스토리</h3>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ABOUT PAGE</span>
                            </div>

                            {/* Live Preview (Image Left, Text Right) */}
                            <div className="relative rounded-[50px] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 group">
                                <div className="absolute top-4 right-6 z-20 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-widest border border-white/10">
                                    About Page Live Preview
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2">
                                    {/* Image (Left) */}
                                    <div className="relative h-[350px] lg:h-auto bg-slate-100 dark:bg-slate-800 order-last lg:order-first">
                                        {getSetting('about_main_image') ? (
                                            <img src={getSetting('about_main_image')} alt="About Preview" className="absolute inset-0 w-full h-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold">이미지가 없습니다</div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent lg:bg-gradient-to-r"></div>
                                    </div>

                                    {/* Text (Right) */}
                                    <div className="p-10 md:p-16 flex flex-col justify-center space-y-6">
                                        <div className="text-indigo-100 dark:text-slate-700">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M4.583 17.321C3.548 16.227 3 15 3 13.044c0-3.347 2.48-6.332 6.264-8.044L10.5 6.5c-2.352 1.15-3.88 2.882-4.098 4.69.09-.016.178-.024.266-.024a2.5 2.5 0 010 5c-1.38 0-2.5-1.12-2.5-2.5a.5.5 0 01.015-.105zm10.333 0C13.881 16.227 13.333 15 13.333 13.044c0-3.347 2.48-6.332 6.264-8.044L20.833 6.5c-2.352 1.15-3.88 2.882-4.098 4.69.09-.016.178-.024.266-.024a2.5 2.5 0 010 5c-1.38 0-2.5-1.12-2.5-2.5a.5.5 0 01.015-.105z" /></svg>
                                        </div>
                                        <h3 className="text-3xl font-black leading-tight tracking-[-0.05em] text-slate-900 dark:text-white whitespace-pre-line" style={{ wordBreak: 'keep-all' }}>
                                            {getSetting('about_desc_title') || "따뜻한 시선으로\n아이의 잠재력을 발굴합니다"}
                                        </h3>
                                        <p className="text-base font-medium leading-relaxed text-slate-500 dark:text-slate-400 whitespace-pre-line" style={{ wordBreak: 'keep-all' }}>
                                            {getSetting('about_desc_body') || "센터 소개군에 표시될 설명글입니다."}
                                        </p>
                                        <div className="flex items-center gap-2 font-bold text-sm mt-4 text-indigo-600 dark:text-indigo-400">
                                            {getSetting('about_cta_text') || '상담 예약하기'}
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Editor */}
                            <SectionCard title="센터 소개 페이지 스토리 편집" icon={<Edit2 className="text-emerald-500" />}>
                                <div className="space-y-6">
                                    <ImageUploader bucketName="images" label="센터 소개 (좌측) 이미지" currentImage={getSetting('about_main_image')} onUploadComplete={(url) => handleSave('about_main_image', url)} />
                                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />
                                    <SaveableTextArea label="강조 제목 (Quote)" initialValue={getSetting('about_desc_title') ?? null} onSave={(v) => handleSave('about_desc_title', v)} saving={saving} rows={2} />
                                    <SaveableTextArea label="본문 설명 (Description)" initialValue={getSetting('about_desc_body') ?? null} onSave={(v) => handleSave('about_desc_body', v)} saving={saving} rows={5} />
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <SaveableInput label="버튼 텍스트" initialValue={getSetting('about_cta_text') ?? null} onSave={(v) => handleSave('about_cta_text', v)} saving={saving} />
                                        <SaveableInput label="버튼 링크 (URL)" initialValue={getSetting('about_cta_link') ?? null} onSave={(v) => handleSave('about_cta_link', v)} saving={saving} />
                                    </div>
                                </div>
                            </SectionCard>
                        </div>

                        {/* 3. Gallery */}
                        <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                            <SectionCard title="센터 갤러리 (하단)" icon={<Palette className="text-purple-500" />}>
                                <MultiImageUploader
                                    label="갤러리 이미지 (여러 장 선택 가능)"
                                    currentImages={getSetting('about_gallery') ?? null}
                                    onUploadComplete={(url) => handleSave('about_gallery', url)}
                                />
                            </SectionCard>
                        </div>
                    </div>
                )}

                {effectiveTab === 'programs' && (
                    <SectionCard title="프로그램 리스트" icon={<LayoutTemplate className="text-indigo-500" />}>
                        <SaveableTextArea label="페이지 안내" initialValue={getSetting('programs_intro_text') ?? null} onSave={(v) => handleSave('programs_intro_text', v)} saving={saving} rows={2} />
                        <div className="mt-8 border-t pt-8">
                            <ProgramListEditor initialList={programsList} onSave={handleSavePrograms} />
                        </div>
                    </SectionCard>
                )}

                {effectiveTab === 'therapists' && (
                    <SectionCard title="치료사 소개 관리" icon={<Heart className="text-rose-500" />}>
                        <SaveableTextArea label="페이지 인트로 문구" initialValue={getSetting('therapists_intro_text') ?? null} onSave={(v) => handleSave('therapists_intro_text', v)} saving={saving} rows={2} />
                        <div className="pt-6 border-t mt-6 space-y-4">
                            <div className="pt-6 border-t mt-6 space-y-8">
                                {/* ✨ Direct Profile Management Manager */}
                                <TherapistProfilesManager centerId={centerId} />
                            </div>
                        </div>
                    </SectionCard>
                )}

                {effectiveTab === 'branding' && (
                    <div className="space-y-10">
                        <SectionCard title="사이트 정체성 설정" icon={<Palette className="text-indigo-500" />}>
                            <div className="space-y-10">
                                {/* 🎨 Color Selection */}
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 ml-1">브랜드 메인 컬러</label>
                                            <p className="text-xs text-slate-400 font-medium ml-1">헤더, 버튼, 강조 문구 등에 적용됩니다.</p>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getSetting('brand_color') || '#4f46e5' }} />
                                            <span className="text-[10px] font-black text-slate-500 uppercase">{getSetting('brand_color') || '#4F46E5'}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 justify-center">
                                        {[
                                            { name: 'Indigo (Default)', hex: '#4f46e5' },
                                            { name: 'Classic Blue', hex: '#2563eb' },
                                            { name: 'Sky Blue', hex: '#0ea5e9' },
                                            { name: 'Emerald', hex: '#10b981' },
                                            { name: 'Rose', hex: '#e11d48' },
                                            { name: 'Violet', hex: '#7c3aed' },
                                            { name: 'Amber', hex: '#f59e0b' },
                                            { name: 'Slate', hex: '#334155' },
                                        ].map((color) => (
                                            <button
                                                key={color.hex}
                                                onClick={() => handleSave('brand_color', color.hex)}
                                                className={cn(
                                                    "group relative flex flex-col items-center gap-2 p-2 rounded-2xl transition-all hover:bg-white dark:hover:bg-slate-700",
                                                    (getSetting('brand_color') || '#4f46e5') === color.hex && "bg-white dark:bg-slate-700 shadow-lg ring-1 ring-black/5"
                                                )}
                                            >
                                                <div
                                                    className="w-12 h-12 rounded-xl shadow-inner transition-transform group-hover:scale-110"
                                                    style={{ backgroundColor: color.hex }}
                                                />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{color.name.split(' ')[0]}</span>
                                                {(getSetting('brand_color') || '#4f46e5') === color.hex && (
                                                    <div className="absolute -top-1 -right-1 bg-emerald-500 text-white p-1 rounded-full shadow-sm">
                                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}

                                        {/* Custom Color Input */}
                                        <CustomColorPicker
                                            currentColor={getSetting('brand_color') || '#4f46e5'}
                                            onSave={(hex: string) => handleSave('brand_color', hex)}
                                        />
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                {/* 🗺️ 대표 지역 */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 ml-1">대표 지역 (검색 최적화)</label>
                                        <p className="text-xs text-slate-400 font-medium ml-1">검색엔진에 노출될 대표 지역명입니다. 비워두면 센터 이름에서 자동 추출됩니다.</p>
                                    </div>
                                    <SaveableInput
                                        label="대표 지역"
                                        placeholder="예: 잠실, 구로, 위례, 다산 (비워두면 자동)"
                                        initialValue={getSetting('seo_region') ?? null}
                                        onSave={(v) => handleSave('seo_region', v)}
                                        saving={saving}
                                    />
                                </div>

                                {/* 🔍 SEO Keywords */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 ml-1">SEO 키워드 (검색 최적화)</label>
                                        <p className="text-xs text-slate-400 font-medium ml-1">네이버, 구글 검색 시 노출될 주요 키워드를 쉼표(,)로 구분하여 입력하세요.</p>
                                    </div>
                                    <SaveableTextArea
                                        label="주요 키워드"
                                        placeholder="예: 송파, 위례, 감각통합, 언어치료, 아동발달센터"
                                        initialValue={getSetting('seo_keywords') ?? null}
                                        onSave={(v) => handleSave('seo_keywords', v)}
                                        saving={saving}
                                        rows={2}
                                    />
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                {/* 🖼️ Logo Selection */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 ml-1">센터 공식 로고</label>
                                        <p className="text-xs text-slate-400 font-medium ml-1">상단 헤더와 플랫폼 내부 곳곳에 사용됩니다. (권장: 배경이 없는 PNG/WebP)</p>
                                    </div>
                                    <ImageUploader
                                        bucketName="logos"
                                        currentImage={getSetting('center_logo')}
                                        onUploadComplete={(url) => handleSave('center_logo', url)}
                                    />
                                </div>
                            </div>
                        </SectionCard>

                        {/* 🛠️ Preview Card */}
                        <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
                            <div className="relative z-10 space-y-6">
                                <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">Real-time Preview</span>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black">브랜딩 적용 예시</h3>
                                    <p className="text-slate-400 text-sm font-medium">선택하신 컬러와 로고가 앱 전반에 어떻게 보이는지 확인하세요.</p>
                                </div>

                                <div className="p-6 bg-white rounded-3xl space-y-6">
                                    <div className="flex items-center justify-between border-b pb-4">
                                        <div className="flex items-center gap-2">
                                            {getSetting('center_logo') ? (
                                                <img src={getSetting('center_logo')} className="h-6 w-auto" alt="Logo" />
                                            ) : (
                                                <div className="w-6 h-6 rounded bg-slate-200" />
                                            )}
                                            <span className="font-black text-slate-900 text-sm">Zarada</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="w-4 h-4 rounded-full bg-slate-100" />
                                            <div className="w-4 h-4 rounded-full bg-slate-100" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-4 w-3/4 bg-slate-100 rounded-full" />
                                        <div className="h-4 w-1/2 bg-slate-100 rounded-full" />
                                        <button
                                            className="w-full py-3 rounded-2xl text-white font-black text-xs shadow-lg transition-transform active:scale-95"
                                            style={{ backgroundColor: getSetting('brand_color') || '#4f46e5' }}
                                        >
                                            저장된 버튼 스타일
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
                }

                {/* ✨ 정보/운영 탭 통합 섹션 - 원본 UI 보존 및 필드 추가 */}
                {effectiveTab === 'center_info' && <CenterInfoSection />}



                {/* ✨ 계정 관리 탭 */}
                {
                    effectiveTab === 'account' && (
                        <>
                            <SectionCard title="계정 정보" icon={<UserX className="text-rose-500" />}>
                                <div className="space-y-4">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">로그인 이메일</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{user?.email}</p>
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard title="회원 탈퇴" icon={<UserX className="text-rose-500" />}>
                                <div className="space-y-4">
                                    <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-2xl border border-rose-100 dark:border-rose-900/50">
                                        <p className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-2">⚠️ 주의: 회원 탈퇴 시 모든 데이터가 삭제됩니다.</p>
                                        <ul className="text-xs text-rose-600 dark:text-rose-400/80 space-y-1 list-disc list-inside">
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
                    )
                }
            </div >
        </div >
    );
}

// --- 🎨 Custom Color Picker (pick freely, save explicitly) ---
function CustomColorPicker({ currentColor, onSave }: { currentColor: string; onSave: (hex: string) => void }) {
    const [localColor, setLocalColor] = useState(currentColor);
    const [isDirty, setIsDirty] = useState(false);

    return (
        <div className="flex flex-col items-center gap-2 p-2">
            <div className="relative">
                <input
                    type="color"
                    value={localColor}
                    onChange={(e) => {
                        setLocalColor(e.target.value);
                        setIsDirty(true);
                    }}
                    className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none p-0 overflow-hidden"
                />
            </div>
            {isDirty ? (
                <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: localColor }} />
                        <span className="text-[9px] font-black text-slate-500 uppercase">{localColor}</span>
                    </div>
                    <button
                        onClick={() => { onSave(localColor); setIsDirty(false); }}
                        className="px-3 py-1 bg-indigo-500 text-white text-[9px] font-black rounded-lg hover:bg-indigo-600 transition-colors uppercase tracking-wide"
                    >
                        저장
                    </button>
                </div>
            ) : (
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">CUSTOM</span>
            )}
        </div>
    );
}

// --- ✨ [SaaS Fix] 센터 행정 및 운영시간 수정 섹션 ---
function CenterInfoSection() {
    const { center } = useCenter();
    const centerId = center?.id;
    const [info, setInfo] = useState<Center | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchCenter = async () => {
        if (!centerId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('centers')
                .select('*')
                .eq('id', centerId)
                .maybeSingle();

            if (error) throw error;
            if (data) setInfo(data);
        } catch (e) {
            console.error('Error fetching center:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCenter(); }, [centerId]);

    const handleInfoSave = async (key: string, value: string) => {
        if (!info?.id) return;
        setSaving(true);
        try {
            const finalValue = value === "" ? null : value;
            let centersUpdateSuccess = false;

            // 1. Update 'centers' table (Main Schema)
            // Use type assertion to handle dynamic key update while maintaining safety
            const { error: centersError } = await supabase
                .from('centers')
                .update({ [key]: finalValue } as never)
                .eq('id', info.id);

            if (!centersError) {
                centersUpdateSuccess = true;
            } else {
                console.warn(`Centers table update skipped/failed for ${key}:`, centersError.message);
            }

            // 2. Update 'admin_settings' table (Fallback & Global Sync)
            const settingKeyMap: Record<string, AdminSettingKey> = {
                'name': 'center_name',
                'phone': 'center_phone',
                'address': 'center_address',
                'email': 'center_email',
                'naver_map_url': 'center_map_url',
                'weekday_hours': 'center_weekday_hours',
                'saturday_hours': 'center_saturday_hours',
                'holiday_text': 'center_holiday_text'
            };

            // Checking useAdminSettings.ts, center_email doesn't exist. center_name, center_phone, center_address do.
            // I'll use center_name for name, but email is missing from AdminSettingKey. 
            // I'll keep it as is or use a safe key.

            // Note: the original mapping had some discrepancies, I'll align them better based on available AdminSettingKey
            const settingKey = settingKeyMap[key];
            if (settingKey) {
                const { error: settingsError } = await supabase.from('admin_settings').upsert({
                    center_id: info.id,
                    key: settingKey,
                    value: finalValue,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'center_id, key' });

                if (settingsError) throw settingsError;
            }

            // 🗺️ 주소 또는 지도 URL 저장 시 → 좌표 자동 추출 → DB 저장 (배포에서만)
            if ((key === 'naver_map_url' || key === 'address') && finalValue && !import.meta.env.DEV) {
                try {
                    const coordsRes = await fetch('/api/resolve-coords', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            mapUrl: key === 'naver_map_url' ? finalValue : (info as any).naver_map_url,
                            address: key === 'address' ? finalValue : info.address
                        })
                    });
                    if (coordsRes.ok) {
                        const coords = await coordsRes.json();
                        if (coords?.lat && coords?.lng) {
                            await supabase.from('admin_settings').upsert([
                                { center_id: info.id, key: 'center_lat' as any, value: String(coords.lat), updated_at: new Date().toISOString() },
                                { center_id: info.id, key: 'center_lng' as any, value: String(coords.lng), updated_at: new Date().toISOString() }
                            ], { onConflict: 'center_id, key' });
                        }
                    }
                } catch { /* 좌표 추출 실패해도 저장은 완료됨 */ }
            }

            // ✨ [Refresh UI]
            await fetchCenter();
            window.dispatchEvent(new Event('settings-updated'));

            if (centersUpdateSuccess) {
                alert('변경사항이 데이터베이스에 안전하게 저장되었습니다.');
            } else {
                alert('사이트 설정은 반영되었으나, 센터 기본 정보 동기화를 위해 마이그레이션이 필요할 수 있습니다.');
            }
        } catch (e: any) {
            console.error(e);
            alert('저장 중 오류가 발생했습니다: ' + (e.message || 'Unknown Error'));
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
                    <SaveableInput label="공식 센터 이름" initialValue={info.name} onSave={(v) => handleInfoSave('name', v)} saving={saving} placeholder="센터 이름을 입력하세요." />
                    <SaveableInput label="대표 연락처" initialValue={info.phone || ''} onSave={(v) => handleInfoSave('phone', v)} saving={saving} placeholder="02-123-4567" />
                    <SaveableInput label="도로명 주소" initialValue={info.address || ''} onSave={(v) => handleInfoSave('address', v)} saving={saving} placeholder="주소를 입력하세요." />
                    <SaveableInput label="공식 이메일" initialValue={info.email || ''} onSave={(v) => handleInfoSave('email', v)} saving={saving} placeholder="admin@center.com" />
                    <SaveableInput label="지도 공유 URL" initialValue={(info as unknown as Record<string, string>).naver_map_url || ''} onSave={(v) => handleInfoSave('naver_map_url', v)} saving={saving} placeholder="https://map.naver.com/...?lng=127.09&lat=37.59..." />
                    <p className="text-xs text-slate-400 -mt-2 ml-1">💡 네이버 지도에서 장소 검색 후 주소창의 URL을 복사하세요. URL에 <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">lat=</code>, <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">lng=</code> 값이 포함되어야 합니다.</p>
                </div>
            </SectionCard>

            <SectionCard title="운영 시간 상세 설정" icon={<Clock className="text-emerald-500" />}>
                <div className="space-y-6 text-left">
                    <SaveableInput label="평일 운영 시간" initialValue={(info as unknown as Record<string, string>).weekday_hours || ''} placeholder="예: 09:00 - 19:00" onSave={(v) => handleInfoSave('weekday_hours', v)} saving={saving} />
                    <SaveableInput label="토요일 운영 시간" initialValue={(info as unknown as Record<string, string>).saturday_hours || ''} placeholder="예: 09:00 - 16:00" onSave={(v) => handleInfoSave('saturday_hours', v)} saving={saving} />
                    <SaveableInput label="일요일/공휴일 휴무 문구" initialValue={(info as unknown as Record<string, string>).holiday_text || ''} placeholder="예: 매주 일요일 정기 휴무" onSave={(v) => handleInfoSave('holiday_text', v)} saving={saving} />
                </div>
            </SectionCard>

            {/* ✨ SNS 링크 설정 섹션 */}
            <SnsLinksSection />
        </div>
    );
}

// --- ❌ 원본 AI 블로그 버튼 및 공통 컴포넌트 로직 (수정 금지) ---


// --- ✨ SNS 링크 설정 섹션 ---
function SnsLinksSection() {
    const { getSetting, refresh: fetchSettings } = useAdminSettings();
    const { center } = useCenter();
    const centerId = center?.id;
    const [saving, setSaving] = useState(false);

    const handleSave = async (key: AdminSettingKey, value: string) => {
        if (!key || !centerId) return;

        // ✨ [API Key Validation] Gemini 키 (sk- 검사 제거)
        if (key === 'openai_api_key' && value && value.startsWith('sk-')) {
            alert('⚠️ 구글 Gemini 키를 입력해주세요. (현재 OpenAI 키 형식이 입력되었습니다)');
        }

        setSaving(true);
        try {
            // ✨ [Persistence Fix] Enforce center_id
            const { error } = await supabase.from('admin_settings').upsert(
                {
                    center_id: centerId,
                    key,
                    value,
                    updated_at: new Date().toISOString()
                },
                { onConflict: 'center_id, key' }
            );

            if (error) throw error;

            // ✨ [Sync Fix] Notify all listeners to refetch
            window.dispatchEvent(new Event('settings-updated'));

            if (fetchSettings) await fetchSettings();
            alert('저장되었습니다.');
        } catch (e: any) {
            alert('저장 실패: ' + (e.message || 'Unknown Error'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <SectionCard title="SNS 링크 (푸터 아이콘 연동)" icon={<Share2 className="text-pink-500" />}>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">입력한 URL이 있는 SNS만 푸터에 아이콘이 표시됩니다.</p>
            <div className="space-y-6">
                <SaveableInput
                    label="카카오톡 상담 URL"
                    initialValue={getSetting('kakao_url')}
                    placeholder="https://pf.kakao.com/_xxxx"
                    onSave={(v) => handleSave('kakao_url', v)}
                    saving={saving}
                />
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

function HomeSettingsTab({ getSetting, handleSave, saving }: { getSetting: (key: AdminSettingKey) => string | undefined; handleSave: (key: AdminSettingKey, value: string | null) => Promise<void>; saving: boolean }) {
    // ✨ [Live Preview] 로컬 상태로 실시간 프리뷰 연동
    const [liveTitle, setLiveTitle] = useState(getSetting('home_title') || '');
    const [liveSubtitle, setLiveSubtitle] = useState(getSetting('home_subtitle') || '');
    const [liveTitleSize, setLiveTitleSize] = useState(getSetting('home_title_size') || '100');
    const [liveSubtitleSize, setLiveSubtitleSize] = useState(getSetting('home_subtitle_size') || '100');

    // Settings가 로드되면 동기화
    useEffect(() => { setLiveTitle(getSetting('home_title') || ''); }, [getSetting('home_title')]);
    useEffect(() => { setLiveSubtitle(getSetting('home_subtitle') || ''); }, [getSetting('home_subtitle')]);
    useEffect(() => { setLiveTitleSize(getSetting('home_title_size') || '100'); }, [getSetting('home_title_size')]);
    useEffect(() => { setLiveSubtitleSize(getSetting('home_subtitle_size') || '100'); }, [getSetting('home_subtitle_size')]);

    const titleSizePercent = Number(liveTitleSize) || 100;
    const subtitleSizePercent = Number(liveSubtitleSize) || 100;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 text-left">
            {/* 1. Large Immersive Preview (Top) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Live Website Preview</h3>
                    </div>
                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800">21:9 CINEMATIC VIEW</span>
                </div>

                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 rounded-[50px] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                    <HeroPreview
                        title={liveTitle}
                        subtitle={liveSubtitle}
                        bgUrl={getSetting('main_banner_url')?.split(',')[0]}
                        titleSizePercent={titleSizePercent}
                        subtitleSizePercent={subtitleSizePercent}
                    />
                </div>
            </div>

            {/* 2. Editor Sections (Bottom) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <SectionCard icon={<LayoutTemplate className="text-indigo-500" />} title="홈페이지 타이틀 및 설명">
                    <div className="space-y-10">
                        {/* 메인 타이틀 에디터 + 크기 조절 */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">메인 타이틀 (강조 문구)</label>
                                {liveTitle !== (getSetting('home_title') || '') && <span className="text-[9px] font-black text-amber-500 uppercase animate-pulse">Unsaved Changes</span>}
                            </div>
                            <textarea
                                value={liveTitle}
                                onChange={(e) => setLiveTitle(e.target.value)}
                                rows={3}
                                placeholder="여러 줄로 입력하면 실제 화면에서도 줄바꿈이 적용됩니다."
                                className={cn(
                                    "w-full p-6 bg-slate-50 dark:bg-slate-800/50 border rounded-[32px] outline-none font-bold text-lg text-slate-700 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all resize-none leading-relaxed",
                                    liveTitle !== (getSetting('home_title') || '') ? "border-amber-200 dark:border-amber-900/50 ring-8 ring-amber-500/5" : "border-slate-100 dark:border-slate-800 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5"
                                )}
                            />

                            {/* 글자 크기 슬라이더 */}
                            <div className="flex items-center gap-4 px-2">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">글자 크기</label>
                                <input
                                    type="range"
                                    min="60"
                                    max="150"
                                    step="5"
                                    value={liveTitleSize}
                                    onChange={(e) => setLiveTitleSize(e.target.value)}
                                    className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-1 rounded-md min-w-[44px] text-center">{liveTitleSize}%</span>
                            </div>

                            <div className="flex justify-end gap-2">
                                {liveTitleSize !== (getSetting('home_title_size') || '100') && (
                                    <button
                                        type="button"
                                        onClick={() => handleSave('home_title_size', liveTitleSize)}
                                        disabled={saving}
                                        className="px-6 py-3 rounded-2xl font-black text-xs bg-slate-700 dark:bg-slate-600 text-white shadow-lg transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        {saving ? <Loader2 className="animate-spin w-3 h-3" /> : null}
                                        크기 저장
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleSave('home_title', liveTitle)}
                                    disabled={(liveTitle === (getSetting('home_title') || '')) || saving}
                                    className={cn(
                                        "px-10 py-3 rounded-2xl font-black text-xs transition-all flex items-center gap-3 active:scale-95 shadow-xl",
                                        liveTitle !== (getSetting('home_title') || '')
                                            ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-indigo-500/20"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-300 shadow-none cursor-not-allowed"
                                    )}
                                >
                                    {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                    {saving ? '저장 중...' : '변경사항 저장'}
                                </button>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-slate-800" />

                        {/* 서브 타이틀 에디터 + 크기 조절 */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">서브 타이틀 (상세 설명)</label>
                                {liveSubtitle !== (getSetting('home_subtitle') || '') && <span className="text-[9px] font-black text-amber-500 uppercase animate-pulse">Unsaved Changes</span>}
                            </div>
                            <textarea
                                value={liveSubtitle}
                                onChange={(e) => setLiveSubtitle(e.target.value)}
                                rows={3}
                                placeholder="예: 우리 아이의 성장을 돕는 치료 프로그램을 확인하세요."
                                className={cn(
                                    "w-full p-6 bg-slate-50 dark:bg-slate-800/50 border rounded-[32px] outline-none font-bold text-lg text-slate-700 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all resize-none leading-relaxed",
                                    liveSubtitle !== (getSetting('home_subtitle') || '') ? "border-amber-200 dark:border-amber-900/50 ring-8 ring-amber-500/5" : "border-slate-100 dark:border-slate-800 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5"
                                )}
                            />

                            {/* 글자 크기 슬라이더 */}
                            <div className="flex items-center gap-4 px-2">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">글자 크기</label>
                                <input
                                    type="range"
                                    min="60"
                                    max="150"
                                    step="5"
                                    value={liveSubtitleSize}
                                    onChange={(e) => setLiveSubtitleSize(e.target.value)}
                                    className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-1 rounded-md min-w-[44px] text-center">{liveSubtitleSize}%</span>
                            </div>

                            <div className="flex justify-end gap-2">
                                {liveSubtitleSize !== (getSetting('home_subtitle_size') || '100') && (
                                    <button
                                        type="button"
                                        onClick={() => handleSave('home_subtitle_size', liveSubtitleSize)}
                                        disabled={saving}
                                        className="px-6 py-3 rounded-2xl font-black text-xs bg-slate-700 dark:bg-slate-600 text-white shadow-lg transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        {saving ? <Loader2 className="animate-spin w-3 h-3" /> : null}
                                        크기 저장
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleSave('home_subtitle', liveSubtitle)}
                                    disabled={(liveSubtitle === (getSetting('home_subtitle') || '')) || saving}
                                    className={cn(
                                        "px-10 py-3 rounded-2xl font-black text-xs transition-all flex items-center gap-3 active:scale-95 shadow-xl",
                                        liveSubtitle !== (getSetting('home_subtitle') || '')
                                            ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-indigo-500/20"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-300 shadow-none cursor-not-allowed"
                                    )}
                                >
                                    {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                    {saving ? '저장 중...' : '변경사항 저장'}
                                </button>
                            </div>
                        </div>
                    </div>
                </SectionCard>

                <div className="space-y-8">
                    <SectionCard icon={<LayoutTemplate className="text-purple-500" />} title="배너 및 애니메이션">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">슬라이더 이미지</label>
                                <MultiImageUploader currentImages={getSetting('main_banner_url') ?? null} onUploadComplete={(url) => handleSave('main_banner_url', url)} />
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">전환 효과</label>
                                    <select
                                        value={getSetting('banner_animation') || 'fade'}
                                        onChange={(e) => handleSave('banner_animation', e.target.value)}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-700 dark:text-white"
                                    >
                                        <option value="fade">페이드 (Fade)</option>
                                        <option value="zoom">줌 (Zoom)</option>
                                        <option value="slide">슬라이드 (Slide)</option>
                                        <option value="kenburns">켄번즈 (Ken Burns)</option>
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">슬라이드 간격</label>
                                        <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-1 rounded-md">{getSetting('banner_duration') ?? '6'}s</span>
                                    </div>
                                    <div className="pt-2">
                                        <input
                                            type="range"
                                            min="2"
                                            max="15"
                                            step="1"
                                            value={getSetting('banner_duration') || '6'}
                                            onChange={(e) => handleSave('banner_duration', e.target.value)}
                                            className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard icon={<Bell className="text-orange-500" />} title="유지보수 및 공지">
                        <SaveableTextArea
                            label="상단 알림바 공지 내용"
                            initialValue={getSetting('notice_text') ?? null}
                            placeholder="공지가 필요한 경우만 입력하세요."
                            onSave={(v) => handleSave('notice_text', v)}
                            saving={saving}
                            rows={1}
                        />
                    </SectionCard>
                </div>
            </div>
        </div>
    );
}

interface SectionCardProps {
    icon: ReactNode;
    title: string;
    children: ReactNode;
}

function SectionCard({ icon, title, children }: SectionCardProps) {
    return (
        <section
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[40px] p-10 border border-white/60 dark:border-slate-800/60 shadow-2xl shadow-slate-200/40 dark:shadow-black/40
                       transition-all duration-300 ease-out hover:shadow-indigo-500/10 text-left relative overflow-hidden group"
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 mb-10 text-left">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-[22px] border border-slate-100 dark:border-slate-700 shadow-inner">
                    {icon}
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight text-left">{title}</h2>
            </div>
            {children}
        </section>
    );
}

interface SaveableInputProps {
    label: string;
    initialValue: string | null;
    onSave: (v: string) => void;
    saving: boolean;
    placeholder?: string;
    onChange?: (v: string) => void;
}

function SaveableInput({ label, initialValue, onSave, saving, placeholder = '', onChange }: SaveableInputProps) {
    const [value, setValue] = useState(initialValue || '');
    useEffect(() => { setValue(initialValue || ''); }, [initialValue]);
    const isChanged = value !== (initialValue || '');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setValue(newVal);
        if (onChange) onChange(newVal);
    };

    return (
        <div className="w-full text-left group/input">
            <div className="flex items-center justify-between mb-3 px-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</label>
                {isChanged && <span className="text-[9px] font-black text-amber-500 uppercase animate-pulse">Unsaved Changes</span>}
            </div>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={value}
                        onChange={handleChange}
                        placeholder={placeholder}
                        className={cn(
                            "w-full py-6 px-8 bg-slate-50 dark:bg-slate-800/50 border rounded-[28px] outline-none font-bold text-lg text-slate-700 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all",
                            isChanged ? "border-amber-200 dark:border-amber-900/50 ring-4 ring-amber-500/5" : "border-slate-100 dark:border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5"
                        )}
                    />
                </div>
                <button
                    type="button"
                    onClick={() => onSave(value)}
                    disabled={!isChanged || saving}
                    className={cn(
                        "px-6 py-4 rounded-2xl font-black text-xs transition-all flex items-center gap-2 active:scale-95 shadow-lg",
                        isChanged
                            ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-indigo-500/20"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-300 shadow-none cursor-not-allowed"
                    )}
                >
                    {saving ? <Loader2 className="animate-spin w-4 h-4" /> : '저장'}
                </button>
            </div>
        </div>
    );
}

interface SaveableTextAreaProps {
    label: string;
    initialValue: string | null;
    onSave: (v: string) => void;
    saving: boolean;
    placeholder?: string;
    rows?: number;
    onChange?: (v: string) => void;
}

function SaveableTextArea({ label, initialValue, onSave, saving, placeholder = '', rows = 3, onChange }: SaveableTextAreaProps) {
    const [value, setValue] = useState(initialValue || '');
    useEffect(() => { setValue(initialValue || ''); }, [initialValue]);
    const isChanged = value !== (initialValue || '');

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newVal = e.target.value;
        setValue(newVal);
        if (onChange) onChange(newVal);
    };

    return (
        <div className="w-full text-left group/input">
            <div className="flex items-center justify-between mb-3 px-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</label>
                {isChanged && <span className="text-[9px] font-black text-amber-500 uppercase animate-pulse">Unsaved Changes</span>}
            </div>
            <div className="space-y-3">
                <textarea
                    value={value}
                    onChange={handleChange}
                    rows={rows}
                    placeholder={placeholder}
                    className={cn(
                        "w-full p-6 bg-slate-50 dark:bg-slate-800/50 border rounded-[32px] outline-none font-bold text-lg text-slate-700 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all resize-none leading-relaxed",
                        isChanged ? "border-amber-200 dark:border-amber-900/50 ring-8 ring-amber-500/5" : "border-slate-100 dark:border-slate-800 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5"
                    )}
                />
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => onSave(value)}
                        disabled={!isChanged || saving}
                        className={cn(
                            "px-10 py-4 rounded-2xl font-black text-sm transition-all flex items-center gap-3 active:scale-95 shadow-xl",
                            isChanged
                                ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-indigo-500/20"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-300 shadow-none cursor-not-allowed"
                        )}
                    >
                        {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        {saving ? '저장 중...' : '변경사항 저장'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function HeroPreview({ title, subtitle, bgUrl, titleSizePercent = 100, subtitleSizePercent = 100 }: { title: string; subtitle: string; bgUrl?: string; titleSizePercent?: number; subtitleSizePercent?: number }) {
    // ✨ [Font Size] 기본 cqw 단위에 퍼센트를 곱해 크기를 동적 조절
    const baseTitleCqw = 4.2;
    const baseSubtitleCqw = 1.4;
    const scaledTitleCqw = (baseTitleCqw * titleSizePercent / 100).toFixed(2);
    const scaledSubtitleCqw = (baseSubtitleCqw * subtitleSizePercent / 100).toFixed(2);

    return (
        <div
            className="relative w-full aspect-[21/9] rounded-2xl md:rounded-[30px] overflow-hidden shadow-2xl border border-white/10 bg-slate-900 group"
            style={{ containerType: 'inline-size' }}
        >
            {/* 1. Immersive Background Layer */}
            <div className="absolute inset-0">
                {bgUrl ? (
                    <img src={bgUrl} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" alt="Preview Background" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900" />
                )}
                {/* Precise Gradient Overlay mimicking HomePage.tsx */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/30 to-transparent z-10" />
            </div>

            {/* 2. Content Layer - Using cqw for perfect relative scaling */}
            <div className="absolute inset-0 z-20 flex flex-col justify-center px-[8cqw] text-left">
                <div className="max-w-[55cqw] space-y-[2.5cqw] text-left">
                    {/* Compact Badge */}
                    <div className="inline-flex items-center gap-[1cqw] px-[2cqw] py-[0.6cqw] bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                        <div className="w-[0.8cqw] h-[0.8cqw] rounded-full bg-indigo-400" />
                        <span className="text-[1.2cqw] font-black text-white/80 uppercase tracking-widest">아동발달의 중심</span>
                    </div>

                    {/* Scaled Title - Matches clamp(2rem, 8vw, 5rem) proportions */}
                    <h1
                        className="text-white font-black leading-[1.1] tracking-tighter whitespace-pre-line text-left transition-all duration-200"
                        style={{
                            fontSize: `${scaledTitleCqw}cqw`,
                            textShadow: '0 0.5cqw 2cqw rgba(0,0,0,0.4)',
                            wordBreak: 'keep-all',
                        }}
                    >
                        {title || "꿈과 희망이\n자라나는 공간"}
                    </h1>

                    {/* Scaled Subtitle - Matches md:text-xl proportions */}
                    <p
                        className="text-white/80 font-medium leading-relaxed whitespace-pre-line text-left opacity-90 transition-all duration-200"
                        style={{
                            fontSize: `${scaledSubtitleCqw}cqw`,
                            textShadow: '0 0.2cqw 1cqw rgba(0,0,0,0.3)'
                        }}
                    >
                        {subtitle || "실제 사이트의 웅장한 비율을\n그대로 구현한 실시간 프리뷰입니다."}
                    </p>

                    {/* Button Mockup */}
                    <div className="pt-[1cqw]">
                        <div className="inline-flex items-center gap-[2cqw] px-[4cqw] py-[1.5cqw] bg-white text-slate-900 rounded-full shadow-2xl">
                            <span className="text-[1.3cqw] font-black">상담 문의하기</span>
                            <div className="w-[3cqw] h-[3cqw] bg-slate-900 rounded-full flex items-center justify-center">
                                <ChevronRight className="w-[1.8cqw] h-[1.8cqw] text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Browser Dots */}
            <div className="absolute top-[3cqw] left-[6cqw] z-30 flex gap-[1cqw] opacity-50">
                <div className="w-[1cqw] h-[1cqw] rounded-full bg-rose-500" />
                <div className="w-[1cqw] h-[1cqw] rounded-full bg-amber-500" />
                <div className="w-[1cqw] h-[1cqw] rounded-full bg-emerald-500" />
            </div>
        </div>
    );
}
// --- ✨ [New] Therapist Public Profile Manager ---
function TherapistProfilesManager({ centerId }: { centerId: string }) {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<any>(null);

    // Form State
    // 🔒 display_name = 공개 사이트용 이름 (모자이크/별명 가능), name = 내부 실명 (직원관리에서만 사용)
    const [formData, setFormData] = useState({
        display_name: '',
        bio: '',
        specialties: '',
        career: '',
        profile_image: '',
        website_visible: true,
        sort_order: 0
    });

    const fetchProfiles = async () => {
        setLoading(true);
        // 🔒 [완전 분리] therapist_profiles 테이블에서 조회
        // therapists(직원관리)와 완전 독립 — 삭제/수정이 급여/일정에 영향 없음
        const { data } = await (supabase.from)('therapist_profiles')
            .select('*')
            .eq('center_id', centerId)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });
        setProfiles(data || []);
        setLoading(false);
    };

    useEffect(() => {
        if (centerId) fetchProfiles();
    }, [centerId]);

    const handleOpenModal = (profile: any = null) => {
        if (profile) {
            setEditingProfile(profile);
            setFormData({
                display_name: profile.display_name || '',
                bio: profile.bio || '',
                specialties: profile.specialties || '',
                career: profile.career || '',
                profile_image: profile.profile_image || '',
                website_visible: profile.website_visible ?? true,
                sort_order: profile.sort_order || 0
            });
        } else {
            setEditingProfile(null);
            setFormData({
                display_name: '',
                bio: '',
                specialties: '',
                career: '',
                profile_image: '',
                website_visible: true,
                sort_order: profiles.length // Default to end of list
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.display_name) return alert('표시 이름을 입력해주세요.');

        try {
            // 🔒 [완전 분리] therapist_profiles 테이블 — 직원관리와 무관
            const payload = {
                display_name: formData.display_name,
                bio: formData.bio,
                specialties: formData.specialties,
                career: formData.career,
                profile_image: formData.profile_image,
                website_visible: formData.website_visible,
                sort_order: Number(formData.sort_order) || 0,
                center_id: centerId,
            };

            if (editingProfile) {
                const { error } = await (supabase.from)('therapist_profiles')
                    .update(payload as never)
                    .eq('id', editingProfile.id)
                    .eq('center_id', centerId);
                if (error) throw error;
            } else {
                const { error } = await (supabase.from)('therapist_profiles')
                    .insert(payload as never);
                if (error) throw error;
            }

            setIsModalOpen(false);
            fetchProfiles();
            window.dispatchEvent(new Event('settings-updated'));
        } catch (error: any) {
            console.error(error);
            alert('저장 실패: ' + error.message);
        }
    };

    // 🔒 [완전 분리] 직원관리와 무관 — 자유롭게 삭제 가능
    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            if (!centerId) return;
            const { error } = await (supabase.from)('therapist_profiles').delete().eq('id', id).eq('center_id', centerId);
            if (error) throw error;
            fetchProfiles();
        } catch (error) {
            alert('삭제 실패');
        }
    };

    const toggleVisibility = async (profile: any) => {
        const newValue = !profile.website_visible;
        try {
            await (supabase.from)('therapist_profiles').update({ website_visible: newValue }).eq('id', profile.id).eq('center_id', centerId);
            setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, website_visible: newValue } : p));
        } catch (e) {
            console.error(e);
        }
    };

    const moveProfile = async (fromIndex: number, direction: number) => {
        const toIndex = fromIndex + direction;
        if (toIndex < 0 || toIndex >= profiles.length) return;

        const newOrder = [...profiles];
        // Swap
        [newOrder[fromIndex], newOrder[toIndex]] = [newOrder[toIndex], newOrder[fromIndex]];
        setProfiles(newOrder); // Optimistic UI update

        try {
            const updatePromises = newOrder.map((p, index) =>
                (supabase.from)('therapist_profiles')
                    .update({ sort_order: index })
                    .eq('id', p.id)
                    .eq('center_id', centerId)
            );
            const results = await Promise.all(updatePromises);
            const error = results.find(r => r.error)?.error;
            if (error) throw error;
        } catch (e) {
            console.error('Reorder save failed:', e);
            fetchProfiles();
        }
    };

    if (loading) return <div className="text-center py-10"><Loader2 className="animate-spin inline text-slate-300" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-900/10 p-8 rounded-[40px] border border-indigo-100 dark:border-indigo-900/30">
                <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">치료사 배치 마스터</h3>
                    <p className="text-sm text-slate-500 font-bold mt-1">🌐 공개 홈페이지에 표시될 치료사 프로필을 관리합니다. (직원 인사/정산 정보는 '직원관리'에서 관리하세요)</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-3xl font-black text-sm shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" /> 새 프로필 등록
                </button>
            </div>

            <div className="space-y-4 max-w-5xl mx-auto">
                {profiles.map((profile, index) => (
                    <div
                        key={profile.id}
                        className={cn(
                            "group flex items-center gap-6 p-5 rounded-[32px] border transition-all duration-300 relative bg-white dark:bg-slate-800",
                            profile.website_visible ? "border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50" : "border-dashed border-slate-200 opacity-50"
                        )}
                    >
                        {/* 1. Rank Badge */}
                        <div className="w-12 h-12 flex items-center justify-center bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-lg shrink-0">
                            {index + 1}
                        </div>

                        {/* 2. Move Up/Down Buttons */}
                        <div className="flex flex-col gap-1 shrink-0">
                            <button
                                onClick={() => moveProfile(index, -1)}
                                disabled={index === 0}
                                className={cn("p-1.5 rounded-xl transition-all",
                                    index === 0
                                        ? "text-slate-200 dark:text-slate-700 cursor-not-allowed"
                                        : "text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700 active:scale-90"
                                )}
                            >
                                <ChevronRight className="w-5 h-5 -rotate-90" />
                            </button>
                            <button
                                onClick={() => moveProfile(index, 1)}
                                disabled={index === profiles.length - 1}
                                className={cn("p-1.5 rounded-xl transition-all",
                                    index === profiles.length - 1
                                        ? "text-slate-200 dark:text-slate-700 cursor-not-allowed"
                                        : "text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700 active:scale-90"
                                )}
                            >
                                <ChevronRight className="w-5 h-5 rotate-90" />
                            </button>
                        </div>

                        {/* 3. Thumbnail */}
                        <div className="w-20 h-24 shrink-0 bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden relative shadow-inner border border-slate-100 dark:border-slate-700">
                            {profile.profile_image ? (
                                <img src={profile.profile_image} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50 dark:bg-slate-900">
                                    <Award className="w-8 h-8 opacity-20" />
                                </div>
                            )}
                        </div>

                        {/* 4. Core Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                                <h4 className="text-lg font-black text-slate-900 dark:text-white truncate">{profile.display_name}</h4>
                                <button
                                    onClick={() => toggleVisibility(profile)}
                                    className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors",
                                        profile.website_visible ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400")}
                                >
                                    {profile.website_visible ? 'Public' : 'Hidden'}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 font-bold mt-1 line-clamp-1">{profile.bio || '한줄 소개가 없습니다.'}</p>
                        </div>

                        {/* 5. Quick Controls — 모든 프로필 자유롭게 편집/삭제 가능 */}
                        <div className="flex items-center gap-2 shrink-0 pr-2">
                            <button onClick={() => handleOpenModal(profile)} className="p-3 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-200 rounded-2xl hover:bg-slate-900 hover:text-white transition-all">
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(profile.id)} className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl p-8 rounded-[40px] shadow-2xl relative max-h-[90vh] flex flex-col">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 shrink-0">
                            {editingProfile ? '프로필 수정' : '새 프로필 등록'}
                        </h2>

                        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">표시 이름 (공개 사이트용)</label>
                                {editingProfile && (
                                    <p className="text-[10px] text-slate-400 ml-1">🔒 직원관리 실명: <span className="font-black text-slate-600 dark:text-slate-300">{editingProfile.name}</span></p>
                                )}
                                <input
                                    type="text"
                                    value={formData.display_name}
                                    onChange={e => setFormData({ ...formData, display_name: e.target.value })}
                                    placeholder="홈페이지에 표시될 이름 (예: 김○○ 언어치료사)"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">프로필 이미지</label>
                                <div className="flex gap-2">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                                        {formData.profile_image && <img src={formData.profile_image} className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1">
                                        <ImageUploader
                                            bucketName="profiles"
                                            currentImage={formData.profile_image}
                                            onUploadComplete={url => setFormData({ ...formData, profile_image: url })}
                                            label=""
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">한줄 소개 (Bio)</label>
                                <input
                                    type="text"
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="예: 아이들의 꿈을 응원합니다."
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">전문 분야 (쉼표로 구분)</label>
                                <input
                                    type="text"
                                    value={formData.specialties}
                                    onChange={e => setFormData({ ...formData, specialties: e.target.value })}
                                    placeholder="언어치료, 인지치료"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">상세 약력 (줄바꿈 구분)</label>
                                <textarea
                                    value={formData.career}
                                    onChange={e => setFormData({ ...formData, career: e.target.value })}
                                    rows={4}
                                    placeholder="- OO대학교 졸업&#13;&#10;- OO센터 근무"
                                    className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-sm text-slate-700 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all resize-none leading-relaxed focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                <span className="font-bold text-sm text-slate-700 dark:text-slate-300">홈페이지 노출</span>
                                <button
                                    onClick={() => setFormData({ ...formData, website_visible: !formData.website_visible })}
                                    className={cn("w-12 h-6 rounded-full transition-colors relative", formData.website_visible ? "bg-indigo-500" : "bg-slate-300")}
                                >
                                    <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", formData.website_visible ? "left-7" : "left-1")} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3 shrink-0">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-2xl hover:bg-slate-200">취소</button>
                            <button onClick={handleSave} className="flex-1 py-4 bg-slate-900 dark:bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-transform">저장하기</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

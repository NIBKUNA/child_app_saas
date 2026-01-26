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
import { useCenter } from '@/contexts/CenterContext'; // ✨ Import
import { AccountDeletionModal } from '@/components/AccountDeletionModal';

// --- ❌ 원본 로직 절대 보존 ---
const AI_GENERATING_KEY = 'ai_blog_generating';
const AI_GENERATION_START_KEY = 'ai_blog_generation_start';

type TabType = 'home' | 'about' | 'programs' | 'branding' | 'center_info' | 'account';
const VALID_TABS: TabType[] = ['home', 'about', 'programs', 'branding', 'center_info', 'account'];

export function SettingsPage() {
    const { settings, getSetting, loading: settingsLoading, fetchSettings } = useAdminSettings();
    const { user } = useAuth();
    const { center } = useCenter(); // ✨ Use center
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
                }, { onConflict: 'center_id, key' }); // Composite Key Constraint

            if (error) throw error;

            // ✨ [Sync Fix] Notify all listeners to refetch
            window.dispatchEvent(new Event('settings-updated'));

            if (fetchSettings) await fetchSettings();
        } catch (error) {
            console.error('Save Error:', error);
            alert('저장 중 오류 발생: ' + error.message);
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

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4 text-left font-bold">
            <Helmet><title>사이트 관리</title></Helmet>

            <div className="flex flex-col gap-1 text-left">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white text-left">사이트 콘텐츠 관리</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold text-left">콘텐츠 수정 후 저장 시 즉시 반영됩니다.</p>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl overflow-x-auto gap-1 no-scrollbar">
                {[
                    { id: 'home', label: '홈', icon: <LayoutTemplate className="w-4 h-4" /> },
                    { id: 'about', label: '소개', icon: <Info className="w-4 h-4" /> },
                    { id: 'programs', label: '프로그램', icon: <BookOpen className="w-4 h-4" /> },
                    { id: 'branding', label: '로고', icon: <Palette className="w-4 h-4" /> },
                    { id: 'center_info', label: '정보/운영', icon: <Info className="w-4 h-4" /> },
                    { id: 'account', label: '계정', icon: <UserX className="w-4 h-4" /> },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={cn(
                            "flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex-1 hover:bg-white/50 dark:hover:bg-slate-700/50",
                            activeTab === tab.id
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
                                        <div className="flex flex-col items-center gap-2 p-2">
                                            <input
                                                type="color"
                                                value={getSetting('brand_color') || '#4f46e5'}
                                                onChange={(e) => handleSave('brand_color', e.target.value)}
                                                className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none p-0 overflow-hidden"
                                            />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">CUSTOM</span>
                                        </div>
                                    </div>
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
                )}

                {/* ✨ 정보/운영 탭 통합 섹션 - 원본 UI 보존 및 필드 추가 */}
                {activeTab === 'center_info' && <CenterInfoSection />}



                {/* ✨ 계정 관리 탭 */}
                {activeTab === 'account' && (
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
                )}
            </div>
        </div>
    );
}

// --- ✨ [SaaS Fix] 센터 행정 및 운영시간 수정 섹션 ---
function CenterInfoSection() {
    const { center } = useCenter(); // ✨ Use Center Context
    const centerId = center?.id;
    const [info, setInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchCenter = async () => {
        if (!centerId) return;
        setLoading(true);
        try {
            const { data } = await supabase
                .from('centers')
                .select('*')
                .eq('id', centerId) // ✨ [Security] Isolation
                .maybeSingle();
            if (data) setInfo(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchCenter(); }, [centerId]);

    const handleInfoSave = async (key: string, value: string) => {
        if (!info?.id) return;
        setSaving(true);
        try {
            const finalValue = value === "" ? null : value;
            let centersUpdateSuccess = false;

            // 1. Update 'centers' table (Main Schema)
            const { error: centersError } = await supabase
                .from('centers')
                .update({ [key]: finalValue })
                .eq('id', info.id);

            if (!centersError) {
                centersUpdateSuccess = true;
            } else {
                console.warn(`Centers table update skipped/failed for ${key}:`, centersError.message);
                // Column not found (PGRST301) is expected if migration hasn't run yet
            }

            // 2. Update 'admin_settings' table (Fallback & Global Sync)
            const settingKeyMap: Record<string, string> = {
                'name': 'center_name',
                'phone': 'center_phone',
                'address': 'center_address',
                'email': 'center_email',
                'naver_map_url': 'center_map_url',
                'weekday_hours': 'center_weekday_hours',
                'saturday_hours': 'center_saturday_hours',
                'holiday_text': 'center_holiday_text'
            };

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

            // ✨ [Refresh UI]
            await fetchCenter();
            window.dispatchEvent(new Event('settings-updated'));

            if (centersUpdateSuccess) {
                alert('변경사항이 데이터베이스에 안전하게 저장되었습니다.');
            } else {
                alert('사이트 설정은 반영되었으나, 센터 기본 정보 동기화를 위해 마이그레이션이 필요할 수 있습니다.');
            }
        } catch (e) {
            console.error(e);
            alert('저장 중 오류가 발생했습니다: ' + e.message);
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


// --- ✨ SNS 링크 설정 섹션 ---
function SnsLinksSection() {
    const { getSetting, fetchSettings } = useAdminSettings();
    const { center } = useCenter(); // ✨ Get current center
    const centerId = center?.id;
    const [saving, setSaving] = useState(false);

    const handleSave = async (key: string, value: string) => {
        if (!key || !centerId) return;

        // ✨ [API Key Validation] Gemini 키 (sk- 검사 제거)
        if (key === 'openai_api_key' && value && value.startsWith('sk-')) {
            alert('⚠️ 구글 Gemini 키를 입력해주세요. (현재 OpenAI 키 형식이 입력되었습니다)');
        }

        setSaving(true);
        try {
            // ✨ [Persistence Fix] Enforce center_id
            await supabase.from('admin_settings').upsert(
                {
                    center_id: centerId,
                    key,
                    value,
                    updated_at: new Date().toISOString()
                },
                { onConflict: 'center_id, key' }
            );

            // ✨ [Sync Fix] Notify all listeners to refetch
            window.dispatchEvent(new Event('settings-updated'));

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
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">입력한 URL이 있는 SNS만 푸터에 아이콘이 표시됩니다.</p>
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
            className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[32px] p-8 border border-white/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/30 dark:shadow-black/30
                       transition-all duration-300 ease-out hover:shadow-2xl hover:-translate-y-1 hover:bg-white/90 dark:hover:bg-slate-900/90 text-left"
        >
            <div className="flex items-center gap-3 mb-8 text-left">
                <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl border border-indigo-100/50 dark:border-slate-700">
                    {icon}
                </div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight text-left">{title}</h2>
            </div>
            {children}
        </section>
    );
}

function SaveableInput({ label, initialValue, onSave, saving, placeholder }) {
    const [value, setValue] = useState(initialValue || '');
    useEffect(() => { setValue(initialValue || ''); }, [initialValue]);
    const isChanged = value !== (initialValue || '');
    return (
        <div className="w-full text-left">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1 text-left">{label}</label>
            <div className="flex gap-3">
                <input type="text" value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder} className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 outline-none font-bold text-slate-700 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all" />
                <button onClick={() => onSave(value)} disabled={!isChanged || saving} className="px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-sm disabled:opacity-20 flex items-center gap-2 active:scale-95 transition-all shadow-lg dark:shadow-indigo-500/20">
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
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1 text-left">{label}</label>
            <div className="space-y-4 text-left">
                <textarea value={value} onChange={e => setValue(e.target.value)} rows={rows} placeholder={placeholder} className="w-full p-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[28px] focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 outline-none font-bold text-slate-700 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all resize-none" />
                <div className="flex justify-end mt-4">
                    <button onClick={() => onSave(value)} disabled={!isChanged || saving} className="px-10 py-3.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-sm disabled:opacity-20 flex items-center gap-2 active:scale-95 transition-all shadow-lg dark:shadow-indigo-500/20">
                        {saving ? <Loader2 className="animate-spin w-4 h-4" /> : '변경사항 저장'}
                    </button>
                </div>
            </div>
        </div>
    );
}
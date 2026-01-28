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
import { MessageCircle, Bell, LayoutTemplate, Info, BookOpen, Palette, CheckCircle2, Brain, Loader2, X, Receipt, Search, ChevronLeft, ChevronRight, Pencil, Clock, Share2, UserX, Heart } from 'lucide-react';
import { useAdminSettings, type AdminSettingKey, type ProgramItem } from '@/hooks/useAdminSettings';
import { ImageUploader } from '@/components/common/ImageUploader';
import { MultiImageUploader } from '@/components/common/MultiImageUploader';
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

type TabType = 'home' | 'about' | 'programs' | 'therapists' | 'branding' | 'center_info' | 'account';
const VALID_TABS: TabType[] = ['home', 'about', 'programs', 'therapists', 'branding', 'center_info', 'account'];

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
                    { id: 'therapists', label: '치료사 소개', icon: <Heart className="w-4 h-4" /> },
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
                    <HomeSettingsTab
                        getSetting={getSetting}
                        handleSave={handleSave}
                        saving={saving}
                    />
                )}

                {activeTab === 'about' && (
                    <SectionCard title="센터 소개 편집">
                        <SaveableTextArea label="인트로 문구" initialValue={getSetting('about_intro_text')} onSave={(v) => handleSave('about_intro_text', v)} saving={saving} rows={2} />
                        <div className="pt-6 border-t mt-6 space-y-6">
                            <ImageUploader bucketName="images" label="메인 이미지" currentImage={getSetting('about_main_image')} onUploadComplete={(url) => handleSave('about_main_image', url)} />
                            <SaveableInput label="강조 제목" initialValue={getSetting('about_desc_title')} onSave={(v) => handleSave('about_desc_title', v)} saving={saving} />
                            <SaveableTextArea label="소개 본문" initialValue={getSetting('about_desc_body')} onSave={(v) => handleSave('about_desc_body', v)} saving={saving} rows={5} />
                        </div>
                        <div className="pt-6 border-t mt-6 space-y-6">
                            <MultiImageUploader label="센터 갤러리 (하단 표시)" currentImages={getSetting('about_gallery')} onUploadComplete={(url) => handleSave('about_gallery', url)} />
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

                {activeTab === 'therapists' && (
                    <SectionCard title="치료사 소개 관리" icon={<Heart className="text-rose-500" />}>
                        <SaveableTextArea label="페이지 인트로 문구" initialValue={getSetting('therapists_intro_text')} onSave={(v) => handleSave('therapists_intro_text', v)} saving={saving} rows={2} />
                        <div className="pt-6 border-t mt-6 space-y-4">
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                                <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-2">💡 관리 팁</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    치료사 개별 프로필(사진, 약력 등)은 <span className="text-indigo-600 font-black">앱 상단 [직원 관리]</span> 메뉴에서 각 직원의 정보를 수정하여 홈페이지에 노출하거나 숨길 수 있습니다.
                                </p>
                            </div>
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

function HomeSettingsTab({ getSetting, handleSave, saving }) {
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
                        title={getSetting('home_title')}
                        subtitle={getSetting('home_subtitle')}
                        bgUrl={getSetting('main_banner_url')?.split(',')[0]}
                    />
                </div>
            </div>

            {/* 2. Editor Sections (Bottom) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <SectionCard icon={<LayoutTemplate className="text-indigo-500" />} title="홈페이지 타이틀 및 설명">
                    <div className="space-y-10">
                        <SaveableTextArea
                            label="메인 타이틀 (강조 문구)"
                            initialValue={getSetting('home_title')}
                            placeholder="여러 줄로 입력하면 실제 화면에서도 줄바꿈이 적용됩니다."
                            onSave={(v) => handleSave('home_title', v)}
                            saving={saving}
                            rows={3}
                        />
                        <SaveableTextArea
                            label="서브 타이틀 (상세 설명)"
                            initialValue={getSetting('home_subtitle')}
                            placeholder="예: 우리 아이의 성장을 돕는 치료 프로그램을 확인하세요."
                            onSave={(v) => handleSave('home_subtitle', v)}
                            saving={saving}
                            rows={3}
                        />
                    </div>
                </SectionCard>

                <div className="space-y-8">
                    <SectionCard icon={<LayoutTemplate className="text-purple-500" />} title="배너 및 애니메이션">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">슬라이더 이미지</label>
                                <MultiImageUploader currentImages={getSetting('main_banner_url')} onUploadComplete={(url) => handleSave('main_banner_url', url)} />
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
                                        <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-1 rounded-md">{getSetting('banner_duration') || '6'}s</span>
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
                            initialValue={getSetting('notice_text')}
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

function SectionCard({ icon, title, children }) {
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

function SaveableInput({ label, initialValue, onSave, saving, placeholder, onChange }) {
    const [value, setValue] = useState(initialValue || '');
    useEffect(() => { setValue(initialValue || ''); }, [initialValue]);
    const isChanged = value !== (initialValue || '');

    const handleChange = (e) => {
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
                            "w-full p-4.5 bg-slate-50 dark:bg-slate-800/50 border rounded-2xl outline-none font-bold text-slate-700 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all",
                            isChanged ? "border-amber-200 dark:border-amber-900/50 ring-4 ring-amber-500/5" : "border-slate-100 dark:border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5"
                        )}
                    />
                </div>
                <button
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

function SaveableTextArea({ label, initialValue, onSave, saving, placeholder, rows = 3, onChange }) {
    const [value, setValue] = useState(initialValue || '');
    useEffect(() => { setValue(initialValue || ''); }, [initialValue]);
    const isChanged = value !== (initialValue || '');

    const handleChange = (e) => {
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

function HeroPreview({ title, subtitle, bgUrl }) {
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
                        className="text-white font-black leading-[1.1] tracking-tighter whitespace-pre-line text-left"
                        style={{
                            fontSize: '4.2cqw',
                            textShadow: '0 0.5cqw 2cqw rgba(0,0,0,0.4)',
                            wordBreak: 'keep-all',
                        }}
                    >
                        {title || "꿈과 희망이\n자라나는 공간"}
                    </h1>

                    {/* Scaled Subtitle - Matches md:text-xl proportions */}
                    <p
                        className="text-white/80 font-medium leading-relaxed whitespace-pre-line text-left opacity-90"
                        style={{
                            fontSize: '1.4cqw',
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

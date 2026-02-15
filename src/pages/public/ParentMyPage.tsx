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
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCenter } from '@/contexts/CenterContext';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { cn } from '@/lib/utils';
import {
    User, Phone, Share2, LogOut, Trash2,
    Gift, ChevronRight, Download, Bell, BellOff, Loader2
} from 'lucide-react';
import { isPushSupported, subscribePush, unsubscribePush, getSubscriptionStatus } from '@/utils/pushNotification';

import { AccountDeletionModal } from '@/components/AccountDeletionModal';
import { InvitationCodeModal } from '@/components/InvitationCodeModal';
import { TermsModal } from '@/components/public/TermsModal';

interface Child {
    name: string;
    birth_date: string;
}

export function ParentMyPage() {
    const { user, signOut, profile } = useAuth();
    const { theme } = useTheme();
    const { getSetting } = useAdminSettings();
    const isDark = theme === 'dark';

    const [children, setChildren] = useState<Child[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null);
    const { center } = useCenter();

    // 🔔 Push Notification State
    const [pushEnabled, setPushEnabled] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);
    const [pushSupported] = useState(isPushSupported());

    // Center Info (could be dynamic or from settings)
    const centerPhone = getSetting('center_phone') || '';
    const centerName = getSetting('center_name') || 'Zarada';

    useEffect(() => {
        if (user) {
            fetchChildren();
            // 푸시 구독 상태 확인
            if (pushSupported) {
                getSubscriptionStatus(user.id).then(setPushEnabled);
            }
        }
    }, [user]);

    const fetchChildren = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Fetch connected children via family_relationships
            const { data: relationships } = await supabase
                .from('family_relationships')
                .select('child_id, children:child_id(name, birth_date)')
                .eq('parent_id', user.id);

            // 2. Fetch connected children via parents table (Legacy)
            const { data: parentRecord } = await supabase
                .from('parents')
                .select('id')
                .eq('profile_id', user.id)
                .maybeSingle();

            let legacyChildren: Child[] = [];
            if (parentRecord) {
                const { data } = await supabase
                    .from('children')
                    .select('name, birth_date')
                    .eq('parent_id', parentRecord.id);
                legacyChildren = (data || []) as Child[];
            }

            // 3. Merge and deduplicate
            const relChildren = (relationships || [])
                .map((r: any) => r.children)
                .filter((c: Child | null): c is Child => c !== null);

            // Deduplicate by name and birth_date since we don't necessarily have IDs for legacy here
            const combined = [...relChildren, ...legacyChildren];
            const uniqueChildren = Array.from(new Map(combined.map((c: any) => [`${c.name}-${c.birth_date}`, c])).values());

            setChildren(uniqueChildren);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: centerName,
            text: `${centerName}에서 우리 아이의 성장을 확인해보세요!`,
            url: window.location.origin
        };
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch { /* Share canceled */ }
        } else {
            navigator.clipboard.writeText(shareData.url).then(() => alert('링크가 복사되었습니다.'));
        }
    };

    const handleLogout = async () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            await signOut();
        }
    };

    const handleInstallApp = () => {
        // Trigger PWA install
        const event = (window as any).deferredPrompt;
        if (event) {
            event.prompt();
            event.userChoice.then(() => {
                (window as any).deferredPrompt = null;
            });
        } else {
            alert('앱을 설치할 수 없는 환경이거나 이미 설치되어 있습니다.\n\n[iOS] 공유 버튼 > 홈 화면에 추가\n[Android] 브라우저 메뉴 > 앱 설치');
        }
    };

    const handleTogglePush = async () => {
        if (!user || pushLoading) return;
        setPushLoading(true);
        try {
            if (pushEnabled) {
                const ok = await unsubscribePush(user.id);
                if (ok) setPushEnabled(false);
            } else {
                const ok = await subscribePush(user.id, center?.id || '');
                if (ok) setPushEnabled(true);
            }
        } finally {
            setPushLoading(false);
        }
    };

    return (
        <div className={cn("min-h-screen p-6 pb-32 transition-colors", isDark ? "bg-slate-950 text-slate-100" : "bg-[#FDFCFB] text-slate-900")}>
            <Helmet><title>마이페이지 | {centerName}</title></Helmet>

            <header className="mb-8 mt-4 px-2">
                <h1 className="text-3xl font-black mb-2">마이페이지</h1>
                <p className={cn("text-sm font-bold", isDark ? "text-slate-400" : "text-slate-500")}>
                    내 정보와 연결된 자녀를 관리합니다.
                </p>
            </header>

            {/* User Profile */}
            <section className={cn(
                "p-6 rounded-[32px] mb-8 flex items-center gap-5 shadow-lg border",
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-slate-200/50"
            )}>
                <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-inner",
                    isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-400"
                )}>
                    {user?.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <User className="w-8 h-8" />
                    )}
                </div>
                <div>
                    <h2 className="text-lg font-black">{profile?.name || user?.user_metadata?.name || '부모님'}</h2>
                    <p className={cn("text-xs font-medium", isDark ? "text-slate-500" : "text-slate-400")}>{user?.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider">Parent</span>
                        {/* ✨ Super Admin Access Button */}
                        {(user?.user_metadata?.role === 'super_admin') && (
                            <a href="/app/dashboard" className="px-2 py-1 rounded-md bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-wider hover:bg-rose-100 transition-colors">
                                관리자 시스템 접속 &rarr;
                            </a>
                        )}
                    </div>
                </div>
            </section>

            {/* Children Management */}
            <section className="mb-8">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-lg font-black flex items-center gap-2">
                        <Gift className="w-5 h-5 text-indigo-500" /> 연결된 자녀
                    </h3>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
                    >
                        + 자녀 추가
                    </button>
                </div>

                <div className="space-y-3">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400 text-sm">로딩 중...</div>
                    ) : children.length > 0 ? (
                        children.map((child, idx) => (
                            <div key={idx} className={cn(
                                "p-5 rounded-3xl flex justify-between items-center border",
                                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                            )}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-black text-sm">
                                        {child.name[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{child.name}</p>
                                        <p className="text-[10px] text-slate-400">{child.birth_date} 생일</p>
                                    </div>
                                </div>
                                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full">연결됨</div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-2">
                            <p className="text-slate-400 font-bold text-sm">연결된 자녀가 없습니다.</p>
                            <button onClick={() => setShowInviteModal(true)} className="text-indigo-600 font-black text-sm underline">초대 코드 입력하기</button>
                        </div>
                    )}
                </div>
            </section>

            {/* Customer Support */}
            <section className="mb-8">
                <h3 className="text-lg font-black flex items-center gap-2 mb-4 px-2">
                    <Phone className="w-5 h-5 text-indigo-500" /> 고객 지원
                </h3>
                <div className={cn(
                    "rounded-[32px] overflow-hidden border custom-button-action",
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                )}>
                    {centerPhone && (
                        <a href={`tel:${centerPhone}`} className="flex items-center justify-between p-5 border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-green-50 text-green-600 rounded-xl"><Phone className="w-5 h-5" /></div>
                                <span className="font-bold text-sm">센터 전화 문의</span>
                            </div>
                            <span className="text-slate-400 text-xs font-medium">{centerPhone}</span>
                        </a>
                    )}
                    <button onClick={handleShare} className="w-full flex items-center justify-between p-5 border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-left">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Share2 className="w-5 h-5" /></div>
                            <span className="font-bold text-sm">지인에게 앱 추천하기</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                    <button onClick={handleInstallApp} className="w-full flex items-center justify-between p-5 border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-left">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Download className="w-5 h-5" /></div>
                            <span className="font-bold text-sm">앱으로 설치하기 (PWA)</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                    {pushSupported && (
                        <button onClick={handleTogglePush} disabled={pushLoading} className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors text-left">
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2.5 rounded-xl", pushEnabled ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-400")}>
                                    {pushLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : pushEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                                </div>
                                <div>
                                    <span className="font-bold text-sm">수업 알림 받기</span>
                                    <p className={cn("text-[10px] mt-0.5", isDark ? "text-slate-500" : "text-slate-400")}>
                                        {pushEnabled ? '알림이 활성화되어 있습니다' : '수업 전날 리마인더를 받아보세요'}
                                    </p>
                                </div>
                            </div>
                            <div className={cn(
                                "w-11 h-6 rounded-full transition-colors relative",
                                pushEnabled ? "bg-indigo-500" : isDark ? "bg-slate-700" : "bg-slate-200"
                            )}>
                                <div className={cn(
                                    "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                                    pushEnabled ? "translate-x-[22px]" : "translate-x-0.5"
                                )} />
                            </div>
                        </button>
                    )}
                    {/* 📱 iOS 홈 화면 추가 안내 — iOS + 아직 PWA 미설치 시만 표시 */}
                    {pushSupported && !pushEnabled && /iPhone|iPad/.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches && (
                        <div className={cn(
                            "mx-5 mb-5 p-4 rounded-2xl border",
                            isDark ? "bg-blue-500/5 border-blue-500/20" : "bg-blue-50 border-blue-100"
                        )}>
                            <p className={cn("text-xs font-black mb-2", isDark ? "text-blue-400" : "text-blue-700")}>
                                📱 iPhone에서 알림을 받으려면
                            </p>
                            <ol className={cn("text-[11px] font-medium space-y-1.5 leading-relaxed", isDark ? "text-slate-400" : "text-blue-600")}>
                                <li>1. Safari 하단의 <strong className={isDark ? "text-white" : "text-blue-800"}>공유 버튼 (□↑)</strong> 터치</li>
                                <li>2. <strong className={isDark ? "text-white" : "text-blue-800"}>"홈 화면에 추가"</strong> 선택</li>
                                <li>3. 추가된 앱에서 알림 켜기</li>
                            </ol>
                            <p className={cn("text-[10px] mt-2 font-medium", isDark ? "text-slate-500" : "text-blue-400")}>
                                ※ iOS 16.4 이상에서만 지원됩니다.
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Policies & Actions */}
            <section className="space-y-3">
                <button onClick={handleLogout} className="w-full p-5 rounded-3xl bg-slate-100 text-slate-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                    <LogOut className="w-4 h-4" /> 로그아웃
                </button>

                <div className="flex justify-center gap-4 py-2">
                    <button onClick={() => setModalType('terms')} className="text-xs font-medium text-slate-400 hover:text-slate-600 underline">이용약관</button>
                    <button onClick={() => setModalType('privacy')} className="text-xs font-medium text-slate-400 hover:text-slate-600 underline">개인정보 처리방침</button>
                </div>

                <div className="pt-4 flex flex-col items-center gap-4">
                    <p className="text-xs text-slate-400 text-center leading-relaxed">
                        계정을 삭제하면 모든 정보가 즉시 파기되며 복구할 수 없습니다.<br />
                        신중하게 결정해 주세요.
                    </p>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="text-rose-400 text-xs font-bold flex items-center gap-1.5 hover:text-rose-600 transition-colors decoration-rose-200 underline underline-offset-4"
                    >
                        <Trash2 className="w-3 h-3" /> 회원 탈퇴하기
                    </button>
                </div>
            </section>

            {/* Modals */}
            <InvitationCodeModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                onSuccess={(name) => {
                    alert(`${name} 어린이와 연결되었습니다!`);
                    fetchChildren();
                    setShowInviteModal(false);
                }}
                parentId={user?.id || ''}
            />

            <AccountDeletionModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                userId={user?.id || ''}
                userEmail={user?.email || ''}
            />

            <TermsModal
                isOpen={!!modalType}
                onClose={() => setModalType(null)}
                type={modalType || 'terms'}
            />
        </div>
    );
}

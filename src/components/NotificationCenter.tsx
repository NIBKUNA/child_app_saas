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
import { useState, useEffect, useRef } from 'react';
import { Bell, User, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    user_id: string;
    is_read: boolean;
    created_at: string;
}

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // 알림 목록 가져오기
    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('admin_notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('알림 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    // 알림 읽음 처리
    const markAsRead = async (id: string) => {
        try {
            await (supabase
                .from('admin_notifications') as any)
                .update({ is_read: true })
                .eq('id', id);

            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('읽음 처리 실패:', error);
        }
    };

    // 모든 알림 읽음 처리
    const markAllAsRead = async () => {
        try {
            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
            if (unreadIds.length === 0) return;

            await (supabase
                .from('admin_notifications') as any)
                .update({ is_read: true })
                .in('id', unreadIds);

            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true }))
            );
        } catch (error) {
            console.error('모두 읽음 처리 실패:', error);
        }
    };

    // 드롭다운 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 드롭다운 열릴 때 알림 가져오기
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    // 시간 포맷팅
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        return `${diffDays}일 전`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* 🔔 알림 아이콘 버튼 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
            >
                <Bell className="w-5 h-5" />

                {/* 읽지 않은 알림 표시 (빨간 점) */}
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                )}
            </button>

            {/* 📋 알림 드롭다운 */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* 헤더 */}
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-black text-sm text-slate-900">알림 센터</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                                >
                                    모두 읽음
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-slate-200 rounded-full"
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* 알림 목록 */}
                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-slate-400 text-sm font-bold">
                                로딩 중...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm font-bold">
                                새로운 알림이 없습니다
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => {
                                        markAsRead(notification.id);
                                        navigate('/app/therapists');
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50",
                                        !notification.is_read && "bg-indigo-50/50"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* 아이콘 */}
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                            notification.type === 'new_user' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                                        )}>
                                            <User className="w-4 h-4" />
                                        </div>

                                        {/* 내용 */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-black text-xs text-slate-900 truncate">
                                                    {notification.title}
                                                </p>
                                                {!notification.is_read && (
                                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-bold mt-0.5 truncate">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-medium mt-1">
                                                {formatTime(notification.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* 푸터 */}
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                        <button
                            onClick={() => {
                                navigate('/app/therapists');
                                setIsOpen(false);
                            }}
                            className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-900"
                        >
                            승인 관리 페이지로 이동 →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

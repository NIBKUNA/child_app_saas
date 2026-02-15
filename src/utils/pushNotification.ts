/**
 * 🔔 PWA Push Notification 유틸리티
 * - 구독/해지, 권한 확인, Supabase 연동
 */
import { supabase } from '@/lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/** base64 → Uint8Array (VAPID 키 변환용) */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length) as any;
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/** 푸시 알림 권한 상태 확인 */
export function getPushPermission(): NotificationPermission | 'unsupported' {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        return 'unsupported';
    }
    return Notification.permission;
}

/** 푸시 알림 지원 여부 */
export function isPushSupported(): boolean {
    return 'Notification' in window
        && 'serviceWorker' in navigator
        && 'PushManager' in window;
}

/** 현재 사용자의 구독 정보를 Supabase에서 조회 */
export async function getSubscriptionStatus(userId: string): Promise<boolean> {
    const { data } = await (supabase as any)
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();
    return !!data;
}

/** 푸시 알림 구독 (권한 요청 → 구독 → DB 저장) */
export async function subscribePush(userId: string, centerId: string): Promise<boolean> {
    try {
        // 1. 권한 요청
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return false;

        // 2. Service Worker 가져오기
        const registration = await navigator.serviceWorker.ready;

        // 3. 기존 구독 확인
        let subscription = await registration.pushManager.getSubscription();

        // 4. 없으면 새로 구독
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
            });
        }

        const subJson = subscription.toJSON();

        // 5. Supabase에 저장 (upsert: user_id + endpoint 기준)
        const { error } = await (supabase as any)
            .from('push_subscriptions')
            .upsert({
                user_id: userId,
                center_id: centerId,
                endpoint: subJson.endpoint,
                p256dh: subJson.keys?.p256dh || '',
                auth: subJson.keys?.auth || '',
                is_active: true,
                device_info: navigator.userAgent.slice(0, 200),
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,endpoint',
            });

        if (error) {
            console.error('[Push] 구독 저장 실패:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('[Push] 구독 실패:', err);
        return false;
    }
}

/** 푸시 알림 구독 해지 */
export async function unsubscribePush(userId: string): Promise<boolean> {
    try {
        // 1. 브라우저 구독 해지
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            await subscription.unsubscribe();
        }

        // 2. DB에서 비활성화
        await (supabase as any)
            .from('push_subscriptions')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('user_id', userId);

        return true;
    } catch (err) {
        console.error('[Push] 구독 해지 실패:', err);
        return false;
    }
}

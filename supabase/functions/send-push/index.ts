// @ts-nocheck — Deno Edge Function (Supabase 런타임에서 실행됨, 로컬 TS 체커 무시)
// =============================================
// 🔔 Supabase Edge Function: send-push
// 
// 설치 방법:
// 1. Supabase 대시보드 > Edge Functions > New Function
// 2. 이름: send-push
// 3. 아래 코드 붙여넣기
// 4. Environment Variables에 추가:
//    - VAPID_PUBLIC_KEY
//    - VAPID_PRIVATE_KEY
//    - VAPID_SUBJECT (예: mailto:admin@myparents.co.kr)
// =============================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// Web Push 암호화 라이브러리 (Deno용)
import webpush from 'https://esm.sh/web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@myparents.co.kr'

// VAPID 설정
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

serve(async (req: Request) => {
    // CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            },
        })
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        const body = await req.json()

        // ── 1. 일일 리마인더 (pg_cron 또는 수동 호출) ──
        if (body.type === 'daily_reminder') {
            const { data: reminders, error } = await supabase.rpc('get_tomorrow_reminders')

            if (error) {
                console.error('리마인더 조회 실패:', error)
                return new Response(JSON.stringify({ error: error.message }), { status: 500 })
            }

            let sent = 0
            let failed = 0

            for (const r of (reminders || [])) {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: r.subscription_endpoint,
                            keys: {
                                p256dh: r.subscription_p256dh,
                                auth: r.subscription_auth,
                            },
                        },
                        JSON.stringify({
                            title: r.push_title,
                            body: r.push_body,
                            url: r.push_url,
                            tag: r.push_tag,
                        })
                    )
                    sent++
                } catch (pushErr: any) {
                    failed++
                    // 410 Gone = 구독 만료 → DB에서 비활성화
                    if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                        await supabase
                            .from('push_subscriptions')
                            .update({ is_active: false })
                            .eq('endpoint', r.subscription_endpoint)
                    }
                    console.error(`푸시 실패 (${r.subscription_endpoint.slice(-20)}):`, pushErr.message)
                }
            }

            return new Response(
                JSON.stringify({ success: true, sent, failed, total: (reminders || []).length }),
                { headers: { 'Content-Type': 'application/json' } }
            )
        }

        // ── 2. 개별 알림 (관리자가 특정 부모에게) ──
        if (body.type === 'direct' && body.user_id && body.title && body.body) {
            const { data: subs } = await supabase
                .from('push_subscriptions')
                .select('endpoint, p256dh, auth')
                .eq('user_id', body.user_id)
                .eq('is_active', true)

            let sent = 0
            for (const sub of (subs || [])) {
                try {
                    await webpush.sendNotification(
                        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                        JSON.stringify({ title: body.title, body: body.body, url: body.url || '/', tag: body.tag || 'direct' })
                    )
                    sent++
                } catch (e: any) {
                    if (e.statusCode === 410 || e.statusCode === 404) {
                        await supabase
                            .from('push_subscriptions')
                            .update({ is_active: false })
                            .eq('endpoint', sub.endpoint)
                    }
                }
            }

            return new Response(
                JSON.stringify({ success: true, sent }),
                { headers: { 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({ error: 'Invalid request type. Use "daily_reminder" or "direct"' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        )

    } catch (err: any) {
        console.error('Edge Function 에러:', err)
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
})

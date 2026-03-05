-- ============================================================
-- 🔔 Zarada ERP: 수업 리마인더 자동 발송 시스템
-- 생성일: 2026-03-04
-- 
-- 이 마이그레이션은:
-- 1. push_subscriptions 테이블 생성 (없을 경우)
-- 2. get_tomorrow_reminders() RPC 함수 생성
-- 3. pg_cron 매 시간 스케줄 등록
-- ============================================================

-- ============================================================
-- PART 1: push_subscriptions 테이블
-- ⚠️ 이미 존재하므로 스킵합니다.
-- 테이블이 없는 경우에만 아래 주석을 해제하세요.
-- ============================================================
-- CREATE TABLE IF NOT EXISTS public.push_subscriptions (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--     center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
--     endpoint TEXT NOT NULL,
--     p256dh TEXT NOT NULL DEFAULT '',
--     auth TEXT NOT NULL DEFAULT '',
--     is_active BOOLEAN DEFAULT true,
--     device_info TEXT DEFAULT '',
--     created_at TIMESTAMPTZ DEFAULT NOW(),
--     updated_at TIMESTAMPTZ DEFAULT NOW(),
--     UNIQUE(user_id, endpoint)
-- );
-- RLS 및 정책도 이미 설정되어 있으므로 스킵

-- ============================================================
-- PART 2: get_tomorrow_reminders() RPC 함수
-- 
-- 매 시간 호출되며, 현재 시간(KST)과 센터별 reminder_hour를 비교하여
-- 해당 시간에 해당하는 센터의 내일 예정 수업 리마인더를 반환합니다.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_tomorrow_reminders()
RETURNS TABLE (
    subscription_endpoint TEXT,
    subscription_p256dh TEXT,
    subscription_auth TEXT,
    push_title TEXT,
    push_body TEXT,
    push_url TEXT,
    push_tag TEXT
) AS $$
DECLARE
    current_kst_hour INT;
BEGIN
    -- 현재 한국 시간(KST)의 시(hour)
    current_kst_hour := EXTRACT(HOUR FROM NOW() AT TIME ZONE 'Asia/Seoul');

    RETURN QUERY
    SELECT 
        ps.endpoint::TEXT AS subscription_endpoint,
        ps.p256dh::TEXT AS subscription_p256dh,
        ps.auth::TEXT AS subscription_auth,
        ('📅 내일 ' || c.name || ' 수업이 있습니다')::TEXT AS push_title,
        ('내일 ' || to_char(s.start_time AT TIME ZONE 'Asia/Seoul', 'HH24시 MI분') || 
         '에 수업이 예정되어 있습니다. 준비해주세요!')::TEXT AS push_body,
        '/parent/home'::TEXT AS push_url,
        ('reminder-' || s.id)::TEXT AS push_tag
    FROM public.schedules s
    -- 아동 정보
    JOIN public.children c ON s.child_id = c.id
    -- 아동 ↔ 부모 연결 (family_relationships)
    JOIN public.family_relationships fr ON fr.child_id = c.id
    -- 부모의 활성 푸시 구독
    JOIN public.push_subscriptions ps 
        ON ps.user_id = fr.parent_id 
        AND ps.is_active = true
    -- 센터별 리마인더 시간 설정
    LEFT JOIN public.admin_settings ast 
        ON ast.center_id = s.center_id 
        AND ast.key = 'reminder_hour'
    WHERE 
        -- 예정된 수업만
        s.status = 'scheduled'
        -- 내일 수업 (KST 기준)
        AND (s.start_time AT TIME ZONE 'Asia/Seoul')::date 
            = (NOW() AT TIME ZONE 'Asia/Seoul' + INTERVAL '1 day')::date
        -- 센터의 설정 시간과 현재 시간 일치 (기본값: 20시)
        AND current_kst_hour = COALESCE(ast.value::INT, 20)
    -- 중복 방지: 같은 부모에게 같은 수업 알림 1회만
    GROUP BY ps.endpoint, ps.p256dh, ps.auth, c.name, s.start_time, s.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PART 3: pg_cron 스케줄 등록
-- 매 시간 정각에 실행 → get_tomorrow_reminders()가 센터별 시간 필터링
-- ============================================================

-- pg_cron 확장 활성화 (이미 있으면 무시)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 기존 스케줄 삭제 (있을 경우)
SELECT cron.unschedule('send-daily-reminders') 
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-daily-reminders');

-- 새 스케줄 등록: 매 시간 정각
SELECT cron.schedule(
    'send-daily-reminders',
    '0 * * * *',
    $$
    SELECT net.http_post(
        url := (
            SELECT decrypted_secret 
            FROM vault.decrypted_secrets 
            WHERE name = 'supabase_url'
            LIMIT 1
        ) || '/functions/v1/send-push',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (
                SELECT decrypted_secret 
                FROM vault.decrypted_secrets 
                WHERE name = 'service_role_key'
                LIMIT 1
            ),
            'Content-Type', 'application/json'
        ),
        body := '{"type": "daily_reminder"}'::jsonb
    );
    $$
);

-- ============================================================
-- 완료 메시지
-- ============================================================
SELECT '✅ 수업 리마인더 시스템 설정 완료 (RPC + Cron)' AS status;

-- ============================================================
-- 📋 사용 방법:
-- 
-- 1. 이 SQL을 Supabase Dashboard > SQL Editor에서 실행
-- 2. vault에 secret 등록 필요:
--    - supabase_url: 프로젝트 URL (예: https://xxx.supabase.co)
--    - service_role_key: Service Role Key
--
--    등록 방법:
--    SELECT vault.create_secret('https://xxx.supabase.co', 'supabase_url');
--    SELECT vault.create_secret('eyJhbG...서비스키', 'service_role_key');
--
-- 3. 또는 Cron 부분을 아래처럼 직접 URL/키 입력도 가능:
--    SELECT cron.schedule(
--        'send-daily-reminders',
--        '0 * * * *',
--        $$
--        SELECT net.http_post(
--            url := 'https://YOUR_PROJECT.supabase.co/functions/v1/send-push',
--            headers := '{"Authorization":"Bearer YOUR_SERVICE_KEY","Content-Type":"application/json"}'::jsonb,
--            body := '{"type":"daily_reminder"}'::jsonb
--        );
--        $$
--    );
-- ============================================================

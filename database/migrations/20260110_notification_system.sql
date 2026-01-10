-- ============================================================
-- Zarada ERP: 신규 가입자 알림 시스템
-- 생성일: 2026-01-10
-- ============================================================

-- ============================================================
-- PART 1: 신규 가입자 알림 Edge Function (Supabase)
-- ============================================================
-- 
-- 이 Edge Function은 Supabase Dashboard에서 생성해야 합니다.
-- 경로: supabase/functions/notify-new-user/index.ts
--
-- ```typescript
-- import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
-- import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
-- 
-- const SUPER_ADMIN_EMAIL = 'anukbin@gmail.com'
-- const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') // Resend.com API Key
-- 
-- serve(async (req) => {
--   const payload = await req.json()
--   const { record } = payload // INSERT 시 새 레코드
--   
--   if (!record) {
--     return new Response('No record', { status: 400 })
--   }
--   
--   // 이메일 전송 (Resend API 사용)
--   const emailResponse = await fetch('https://api.resend.com/emails', {
--     method: 'POST',
--     headers: {
--       'Authorization': `Bearer ${RESEND_API_KEY}`,
--       'Content-Type': 'application/json'
--     },
--     body: JSON.stringify({
--       from: 'Zarada ERP <noreply@zarada.co.kr>',
--       to: [SUPER_ADMIN_EMAIL],
--       subject: `[자라다 ERP] 신규 가입 신청: ${record.name}`,
--       html: `
--         <h2>신규 가입 신청이 있습니다</h2>
--         <p><strong>이름:</strong> ${record.name}</p>
--         <p><strong>이메일:</strong> ${record.email}</p>
--         <p><strong>역할:</strong> ${record.role}</p>
--         <p><strong>상태:</strong> ${record.status}</p>
--         <p><strong>가입일:</strong> ${record.created_at}</p>
--         <br>
--         <a href="https://zarada.co.kr/app/therapists">승인 페이지 바로가기</a>
--       `
--     })
--   })
--   
--   return new Response(JSON.stringify({ success: true }), {
--     headers: { 'Content-Type': 'application/json' }
--   })
-- })
-- ```

-- ============================================================
-- PART 2: Database Webhook 설정 (Supabase Dashboard)
-- ============================================================
--
-- 1. Supabase Dashboard → Database → Webhooks
-- 2. "Create webhook" 클릭
-- 3. 설정:
--    - Name: notify-new-user
--    - Table: user_profiles
--    - Events: INSERT
--    - Type: Supabase Edge Functions
--    - Function: notify-new-user
--

-- ============================================================
-- PART 3: 대안 - Database Trigger로 알림 테이블에 기록
-- ============================================================

-- 알림 테이블 생성
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL DEFAULT 'new_user',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    user_id UUID REFERENCES user_profiles(id),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 신규 가입자 알림 자동 생성 함수
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 신규 가입자 알림 생성
    INSERT INTO public.admin_notifications (type, title, message, user_id)
    VALUES (
        'new_user',
        '신규 가입 신청: ' || NEW.name,
        NEW.email || ' (' || NEW.role || ') - ' || NEW.status,
        NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS on_new_user_notify ON public.user_profiles;

-- 신규 가입자 알림 트리거
CREATE TRIGGER on_new_user_notify
    AFTER INSERT ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admin_new_user();

-- admin_notifications 테이블 RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Super Admin만 알림 조회 가능
CREATE POLICY "super_admin_all_notifications" ON public.admin_notifications
FOR ALL USING (auth.email() = 'anukbin@gmail.com');

-- Admin은 본인 센터 사용자 알림만
CREATE POLICY "admin_center_notifications" ON public.admin_notifications
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        JOIN user_profiles admin_up ON admin_up.id = auth.uid()
        WHERE up.id = admin_notifications.user_id
        AND admin_up.role = 'admin'
        AND admin_up.center_id = up.center_id
    )
);

-- ============================================================
-- 완료 메시지
-- ============================================================
SELECT '✅ 알림 시스템 설정 완료' AS status;

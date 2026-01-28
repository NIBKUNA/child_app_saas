-- Migration: Add consult_price to therapists table
-- -----------------------------------------------------------
-- 🛠️ Created by: Antigravity
-- 📅 Date: 2026-01-28
-- 🖋️ Description: "상담 수당(consult_price) 컬럼 추가 및 스키마 새로고침"

ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS consult_price integer DEFAULT 0;
COMMENT ON COLUMN public.therapists.consult_price IS '상담 회기당 수당 (프리랜서용 또는 정규직 상담 인센티브)';

-- Reload Schema cache
NOTIFY pgrst, 'reload schema';

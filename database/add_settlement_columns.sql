-- Migration: Add Advanced Settlement Columns to Therapists Table

ALTER TABLE public.therapists 
ADD COLUMN IF NOT EXISTS hire_type text DEFAULT 'freelancer', -- 'regular' | 'freelancer'
ADD COLUMN IF NOT EXISTS base_salary integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS required_sessions integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_price_weekday integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_price_weekend integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS incentive_price integer DEFAULT 24000,
ADD COLUMN IF NOT EXISTS evaluation_price integer DEFAULT 50000;

-- Comment on columns for clarity
COMMENT ON COLUMN public.therapists.hire_type IS '고용 형태 (정규직/프리랜서)';
COMMENT ON COLUMN public.therapists.base_salary IS '기본급 (정규직용)';
COMMENT ON COLUMN public.therapists.required_sessions IS '필수 이수 회기 (정규직용)';
COMMENT ON COLUMN public.therapists.incentive_price IS '초과 회기당 인센티브 (정규직용)';
COMMENT ON COLUMN public.therapists.evaluation_price IS '평가 회기당 번외 수당 (공통)';

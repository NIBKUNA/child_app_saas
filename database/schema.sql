-- ============================================
-- 아동발달센터 관리 플랫폼 데이터베이스 스키마 (최종 통합본)
-- Child Development Center Management Platform
-- Database: Supabase (PostgreSQL)
-- Update: 2026-02-13 (Antigravity)
-- ============================================
-- 📌 이 파일은 Supabase에 실제 배포된 스키마의 참조 문서입니다.
-- 📌 실제 적용은 database/migrations/ 폴더의 마이그레이션 파일로 수행합니다.
-- ============================================

-- ============================================
-- 1. Enums (Custom Types)
-- ============================================

-- 성별
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');

-- 사용자 역할
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin',
  'manager',
  'therapist',
  'staff',
  'parent'
);

-- 일정 상태
CREATE TYPE schedule_status AS ENUM (
  'scheduled',
  'completed',
  'cancelled',
  'no_show',
  'carried_over'
);

-- 리드 상태
CREATE TYPE lead_status AS ENUM (
  'new',
  'contacted',
  'scheduled',
  'converted',
  'cancelled'
);

-- 바우처 유형
CREATE TYPE voucher_type AS ENUM (
  'developmental_voucher',
  'language_voucher',
  'special_education'
);

-- ============================================
-- 2. Core Tables
-- ============================================

-- 센터 정보
CREATE TABLE centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  business_number VARCHAR(20),
  representative VARCHAR(50),
  logo_url TEXT,
  weekday_hours VARCHAR(50),
  saturday_hours VARCHAR(50),
  holiday_text TEXT,
  naver_map_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 프로필 (auth.users 와 1:1)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  center_id UUID REFERENCES centers(id),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  phone VARCHAR(20),
  role user_role NOT NULL DEFAULT 'parent',
  is_active BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로필 뷰 (호환용)
CREATE VIEW profiles AS SELECT * FROM user_profiles;

-- ============================================
-- 3. Staff & Family Tables
-- ============================================

-- 치료사/직원 상세 정보
CREATE TABLE therapists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  center_id UUID REFERENCES centers(id),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  contact VARCHAR(50),
  color VARCHAR(10),
  hire_type VARCHAR(20),            -- full_time, regular, freelancer
  license_type VARCHAR(100),
  license_number VARCHAR(50),
  specialization TEXT[],
  system_role VARCHAR(20),
  system_status VARCHAR(20) DEFAULT 'active',
  hourly_rate INTEGER DEFAULT 0,
  consult_price INTEGER DEFAULT 0,

  -- 정산 관련 필드
  base_salary INTEGER DEFAULT 0,
  required_sessions INTEGER DEFAULT 90,
  session_price_weekday INTEGER DEFAULT 10000,
  session_price_weekend INTEGER DEFAULT 12000,
  incentive_price INTEGER DEFAULT 24000,
  evaluation_price INTEGER DEFAULT 50000,
  remarks TEXT,

  -- 계좌 정보
  bank_name VARCHAR(50),
  account_number VARCHAR(50),
  account_holder VARCHAR(50),

  -- 프로필 전시용 (레거시, therapist_profiles로 이관 중)
  bio TEXT,
  career TEXT,
  specialties TEXT,
  profile_image TEXT,
  website_visible BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 부모/보호자 상세 정보
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  center_id UUID REFERENCES centers(id),
  name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 아동 정보
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  parent_id UUID REFERENCES parents(id),
  name VARCHAR(100) NOT NULL,
  birth_date DATE NOT NULL,
  gender gender_type,
  contact VARCHAR(50),
  guardian_name VARCHAR(100),
  diagnosis TEXT,
  registration_number VARCHAR(50),
  school_name VARCHAR(100),
  grade VARCHAR(20),
  notes TEXT,
  photo_url TEXT,
  inflow_source VARCHAR(100),
  medical_history TEXT,
  credit INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  invitation_code VARCHAR(10),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 가족 관계 (부모-아동 연결 테이블)
CREATE TABLE family_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  center_id UUID REFERENCES centers(id),
  relationship VARCHAR(50) DEFAULT 'parent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 아동-치료사 배정 (다대다 관계)
CREATE TABLE child_therapist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  service_type VARCHAR(50),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. Operations Tables
-- ============================================

-- 프로그램/서비스
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'therapy',
  duration INTEGER NOT NULL DEFAULT 40,
  price INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 상담실
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  name VARCHAR(100) NOT NULL,
  capacity INTEGER,
  color VARCHAR(10),
  equipment TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 일정
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES therapists(id) ON DELETE SET NULL,
  program_id UUID REFERENCES programs(id),
  room_id UUID REFERENCES rooms(id),
  date DATE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  title VARCHAR(200),
  notes TEXT,
  status schedule_status DEFAULT 'scheduled',
  service_type VARCHAR(50),
  session_no INTEGER,
  session_note TEXT,
  cancellation_reason TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  parent_schedule_id UUID REFERENCES schedules(id),
  makeup_for_id UUID REFERENCES schedules(id),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 상담 일지 (통합)
CREATE TABLE counseling_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  schedule_id UUID REFERENCES schedules(id),
  child_id UUID REFERENCES children(id),
  therapist_id UUID REFERENCES therapists(id),
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT,
  activities TEXT,
  child_response TEXT,
  next_plan TEXT,
  parent_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 레거시 일일 로그 (counseling_logs로 통합됨)
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES schedules(id)
);

-- ============================================
-- 5. Financial Tables
-- ============================================

-- 수납/결제
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  child_id UUID REFERENCES children(id),
  payment_month VARCHAR(7) NOT NULL,     -- 'YYYY-MM'
  amount INTEGER,
  credit_used INTEGER DEFAULT 0,
  method VARCHAR(20),                     -- card, cash, transfer
  memo TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 수납 항목 (결제-일정 매핑)
CREATE TABLE payment_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES payments(id),
  schedule_id UUID REFERENCES schedules(id),
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 바우처 관리
CREATE TABLE vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id),
  voucher_type voucher_type NOT NULL,
  voucher_number VARCHAR(50),
  total_sessions INTEGER NOT NULL,
  used_sessions INTEGER DEFAULT 0,
  remaining_sessions INTEGER,
  session_price INTEGER,
  government_support INTEGER,
  self_payment INTEGER,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. Assessment & Observation Tables
-- ============================================

-- 발달 평가
CREATE TABLE development_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  child_id UUID REFERENCES children(id),
  therapist_id UUID REFERENCES therapists(id),
  counseling_log_id UUID REFERENCES counseling_logs(id),
  log_id UUID,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  evaluation_content TEXT,
  assessment_data JSONB,
  assessment_details JSONB,
  content JSONB,
  summary TEXT,
  therapist_notes TEXT,
  score_cognitive INTEGER,
  score_communication INTEGER,
  score_motor INTEGER,
  score_social INTEGER,
  score_adaptive INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 보호자 관찰 기록
CREATE TABLE parent_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  child_id UUID REFERENCES children(id),
  parent_id UUID REFERENCES user_profiles(id),
  observation_date DATE DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. Marketing & Analytics Tables
-- ============================================

-- 상담 문의 (홈페이지 접수)
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  child_id UUID REFERENCES children(id),
  schedule_id UUID,
  child_name VARCHAR(100) NOT NULL,
  child_birth_date DATE,
  child_gender gender_type,
  guardian_name VARCHAR(100),
  guardian_phone VARCHAR(20),
  guardian_relationship VARCHAR(50),
  concern TEXT,
  consultation_area TEXT[],
  preferred_consult_schedule TEXT,
  preferred_class_schedule TEXT,
  diagnosis TEXT,
  inflow_source VARCHAR(100),
  marketing_source TEXT,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 리드 관리
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  parent_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  child_name VARCHAR(100),
  child_birth_year INTEGER,
  child_gender gender_type,
  concern TEXT,
  preferred_service TEXT[],
  preferred_time TEXT,
  source VARCHAR(100),
  status lead_status DEFAULT 'new',
  admin_notes TEXT,
  assigned_to UUID,
  converted_child_id UUID REFERENCES children(id),
  converted_parent_id UUID,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사이트 방문 기록 (마케팅 분석용)
CREATE TABLE site_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  visitor_id UUID,
  source_category VARCHAR(50),
  page_url TEXT,
  referrer_url TEXT,
  user_agent TEXT,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 마케팅 통계 (집계)
CREATE TABLE marketing_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  date DATE,
  total_visits INTEGER,
  new_leads INTEGER,
  conversion_rate NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. Content & Settings Tables
-- ============================================

-- 블로그 포스트
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  author_id UUID,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  cover_image_url TEXT,
  keywords TEXT,
  seo_title VARCHAR(200),
  seo_description TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 가정 양육 팁
CREATE TABLE home_care_tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 관리자 설정 (센터별 key-value)
CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID NOT NULL REFERENCES centers(id),
  key VARCHAR(100) NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(center_id, key)
);

-- 관리자 알림
CREATE TABLE admin_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  user_id UUID,
  type VARCHAR(50),
  title VARCHAR(200),
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 디버그 로그 (개발용)
CREATE TABLE debug_logs (
  id SERIAL PRIMARY KEY,
  message TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 치료사 프로필 (홈페이지 전시용, therapists 테이블과 분리)
-- 참조: database/migrations/20260213_create_therapist_profiles.sql
CREATE TABLE therapist_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID NOT NULL REFERENCES centers(id),
  display_name VARCHAR(100) NOT NULL,
  bio TEXT,
  career TEXT,
  specialties TEXT,
  profile_image TEXT,
  website_visible BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. Row Level Security (RLS)
-- ============================================

-- A. user_profiles 격리 정책
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_user_profiles_isolation" ON public.user_profiles
FOR SELECT TO authenticated
USING (
    id = auth.uid()
    OR
    center_id = (SELECT center_id FROM public.user_profiles WHERE id = auth.uid())
    OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'super_admin'
);

-- B. therapists 관리 정책
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_therapists_center_isolation" ON public.therapists
FOR ALL TO authenticated
USING (
    center_id = (SELECT center_id FROM public.user_profiles WHERE id = auth.uid())
    OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'super_admin'
)
WITH CHECK (
    center_id = (SELECT center_id FROM public.user_profiles WHERE id = auth.uid())
    OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'super_admin'
);

-- C. therapist_profiles 정책 (참조: 20260213_fix_therapist_profiles_rls.sql)
ALTER TABLE therapist_profiles ENABLE ROW LEVEL SECURITY;
-- 공개 읽기 + 관리자 CRUD (super_admin 센터 무관 접근)

-- D. site_visits 정책
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
-- anon INSERT 허용 + 관리자 SELECT 필요

-- ============================================
-- 10. Triggers & Functions
-- ============================================

-- 역할 동기화 트리거
CREATE OR REPLACE FUNCTION sync_role_logic() RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_profiles SET role = NEW.system_role::user_role
    WHERE id = NEW.profile_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_sync_therapist_role
    AFTER UPDATE OF system_role ON therapists
    FOR EACH ROW EXECUTE FUNCTION sync_role_logic();

-- 초대 코드 자동 생성
CREATE OR REPLACE FUNCTION public.generate_inv_code() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invitation_code IS NULL THEN
        NEW.invitation_code := upper(substring(md5(random()::text) from 1 for 6));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_child_inv_code
    BEFORE INSERT ON children
    FOR EACH ROW EXECUTE FUNCTION public.generate_inv_code();

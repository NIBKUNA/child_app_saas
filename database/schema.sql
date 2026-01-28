-- ============================================
-- 아동발달센터 관리 플랫폼 데이터베이스 스키마 (최종 통합본)
-- Child Development Center Management Platform
-- Database: Supabase (PostgreSQL)
-- Update: 2026-01-28 (Antigravity)
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ENUM Types
-- ============================================

-- 사용자 역할
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'therapist', 'parent', 'super_admin');

-- 일정 상태
CREATE TYPE schedule_status AS ENUM ('scheduled', 'completed', 'cancelled', 'makeup');

-- 결제 유형
CREATE TYPE payment_type AS ENUM ('voucher', 'general');

-- 결제 상태
CREATE TYPE payment_status AS ENUM ('paid', 'unpaid', 'refunded', 'partial');

-- 성별
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');

-- 바우처 유형
CREATE TYPE voucher_type AS ENUM (
  'developmental_voucher',
  'language_voucher',
  'emotional_voucher',
  'general'
);

-- 리드 상태
CREATE TYPE lead_status AS ENUM (
  'new',
  'contacted',
  'scheduled',
  'converted',
  'cancelled'
);

-- ============================================
-- 2. Core Tables
-- ============================================

-- 센터 정보
CREATE TABLE centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE,             -- ✨ SaaS URL용 슬러그
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  business_number VARCHAR(20),
  representative VARCHAR(50),
  logo_url TEXT,
  branding_color VARCHAR(20),          -- ✨ 브랜드 색상
  weekday_hours VARCHAR(100),
  saturday_hours VARCHAR(100),
  holiday_text VARCHAR(100),
  naver_map_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 프로필
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  center_id UUID REFERENCES centers(id),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role user_role NOT NULL DEFAULT 'parent',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 치료사/직원 상세 정보
CREATE TABLE therapists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  center_id UUID REFERENCES centers(id),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,            -- ✨ 이메일 유니크 (초대 로직용)
  phone VARCHAR(20),
  contact VARCHAR(50),                 -- ✨ 추가 연락처 컨텍스트
  specialization VARCHAR(100)[],
  license_number VARCHAR(50),
  license_type VARCHAR(100),
  hourly_rate DECIMAL(10, 2),
  color VARCHAR(7) DEFAULT '#3B82F6',
  bio TEXT,
  career TEXT,                         -- ✨ 경력
  specialties TEXT,                    -- ✨ 전문 분야 상세
  profile_image TEXT,                  -- ✨ 프로필 이미지 URL
  website_visible BOOLEAN DEFAULT TRUE, -- ✨ 공개 홈페이지 노출 여부
  
  -- 급여 및 고용 정보
  hire_type VARCHAR(20) DEFAULT 'freelancer', -- 'regular' | 'freelancer'
  system_role VARCHAR(20) DEFAULT 'therapist',
  system_status VARCHAR(20) DEFAULT 'active',
  base_salary INTEGER DEFAULT 0,
  required_sessions INTEGER DEFAULT 0,
  session_price_weekday INTEGER DEFAULT 0,
  session_price_weekend INTEGER DEFAULT 0,
  consult_price INTEGER DEFAULT 0,      -- ✨ 상담 수당
  incentive_price INTEGER DEFAULT 24000, -- ✨ 초과 세션 인센티브
  evaluation_price INTEGER DEFAULT 50000, -- ✨ 평가 수당
  remarks TEXT,                        -- ✨ 관리자 메모
  
  -- 계좌 정보
  bank_name VARCHAR(50),
  account_number VARCHAR(50),
  account_holder VARCHAR(50),
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 부모/보호자 상세 정보
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  center_id UUID REFERENCES centers(id),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  address TEXT,
  emergency_contact VARCHAR(20),
  relationship VARCHAR(50),
  notes TEXT,
  referral_source VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 아동/내담자 정보
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  birth_date DATE NOT NULL,
  gender gender_type,
  guardian_name VARCHAR(100),          -- ✨ 보호자 성함 (수동입력용)
  contact VARCHAR(50),                 -- ✨ 아동용 비상연락처
  registration_number VARCHAR(50),     -- ✨ 관리 번호
  invitation_code VARCHAR(10) UNIQUE,  -- ✨ 앱 연결용 초대코드
  school_name VARCHAR(100),
  grade VARCHAR(20),
  diagnosis TEXT,
  medical_history TEXT,
  notes TEXT,
  photo_url TEXT,
  inflow_source VARCHAR(100),
  credit INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family Relationships (Parent-Child Junction)
CREATE TABLE family_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  relationship VARCHAR(50) DEFAULT 'parent',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);

-- 초기 상담 신청서
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  child_name VARCHAR(100) NOT NULL,
  child_gender gender_type,
  child_birth_date DATE,
  concern TEXT,
  diagnosis VARCHAR(100),
  consultation_area VARCHAR(100)[],
  preferred_consult_schedule VARCHAR(200),
  preferred_class_schedule VARCHAR(200),
  guardian_name VARCHAR(100),
  guardian_phone VARCHAR(20),
  guardian_relationship VARCHAR(50),
  inflow_source VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로그램 (세션 유형)
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) DEFAULT 'therapy', -- therapy, evaluation, counseling
  duration INTEGER NOT NULL DEFAULT 40,
  price INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 일정
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES therapists(id) ON DELETE SET NULL,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL, -- ✨ 프로그램 연결
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  title VARCHAR(200),
  service_type VARCHAR(50),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status schedule_status DEFAULT 'scheduled',
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  parent_schedule_id UUID REFERENCES schedules(id),
  cancellation_reason TEXT,
  makeup_for_id UUID REFERENCES schedules(id),
  notes TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- (중간 생략 - 나머지 clinical_records, billing 등은 기존과 동일하되 위 컬럼들 참조 유지)
-- -----------------------------------------------------------

-- ============================================
-- 8. Row Level Security (RLS) 및 권한 설정
-- ============================================

-- A. user_profiles 격리 정책 (정보 유출 방지)
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
CREATE POLICY "p_therapists_admin_manage" ON public.therapists
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() 
        AND (role IN ('admin', 'super_admin') OR id = therapists.profile_id)
    )
);

-- ============================================
-- 9. Triggers & Functions (동기화 로직)
-- ============================================

-- Role Sync: Profile <-> Therapist
CREATE OR REPLACE FUNCTION sync_role_logic()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'user_profiles' THEN
        UPDATE public.therapists SET system_role = NEW.role::text WHERE profile_id = NEW.id;
    ELSIF TG_TABLE_NAME = 'therapists' THEN
        UPDATE public.user_profiles SET role = NEW.system_role::user_role WHERE id = NEW.profile_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_sync_profile_role AFTER UPDATE OF role ON user_profiles FOR EACH ROW EXECUTE FUNCTION sync_role_logic();
CREATE TRIGGER tr_sync_therapist_role AFTER UPDATE OF system_role ON therapists FOR EACH ROW EXECUTE FUNCTION sync_role_logic();

-- Invitation Code Auto Generator
CREATE OR REPLACE FUNCTION public.generate_inv_code() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invitation_code IS NULL THEN
        NEW.invitation_code := upper(substring(md5(random()::text) from 1 for 6));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_child_inv_code BEFORE INSERT ON children FOR EACH ROW EXECUTE FUNCTION public.generate_inv_code();

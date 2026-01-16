-- 👑 ZARADA ERP: INTEGRATED SETUP SCRIPT (V1.0)
-- 🛠️ Created for: New Center Deployment (Copy & Paste Strategy)
-- 📅 Date: 2026-01-17
-- ⚠️ Usage: Run this ENTIRE script in the Supabase SQL Editor of the NEW project.

-- =================================================================
-- SECTION 1: EXTENSIONS & ENUMS (기초 공사)
-- =================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  'developmental_voucher',      -- 발달재활서비스 바우처
  'language_voucher',           -- 언어발달지원 바우처
  'emotional_voucher',          -- 정서지원 바우처
  'general'                     -- 일반 결제
);

-- 리드 상태 (상담 문의)
CREATE TYPE lead_status AS ENUM (
  'new',          -- 신규 문의
  'contacted',    -- 연락 완료
  'scheduled',    -- 상담 예정
  'converted',    -- 내담자 전환
  'cancelled'     -- 취소/거절
);

-- =================================================================
-- SECTION 2: CORE TABLES (뼈대 구축)
-- =================================================================

-- 센터 정보
CREATE TABLE centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  business_number VARCHAR(20),
  representative VARCHAR(50),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 프로필 (Supabase Auth 확장)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  center_id UUID REFERENCES centers(id),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role user_role NOT NULL DEFAULT 'parent',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legacy Compatibility View (이전 코드 호환성용)
CREATE OR REPLACE VIEW user_profiles AS SELECT * FROM profiles;

-- 치료사 상세 정보
CREATE TABLE therapists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
  center_id UUID REFERENCES centers(id),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  specialization VARCHAR(100)[],
  license_number VARCHAR(50),
  license_type VARCHAR(100),
  hourly_rate DECIMAL(10, 2),
  color VARCHAR(7) DEFAULT '#3B82F6',
  bio TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 부모/보호자 상세 정보
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
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
  marketing_source VARCHAR(100), -- 마케팅 유입 경로
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 아동-치료사 연결
CREATE TABLE child_therapist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
  service_type VARCHAR(50),
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, therapist_id, service_type)
);

-- 치료실/룸
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  name VARCHAR(50) NOT NULL,
  capacity INTEGER DEFAULT 1,
  equipment TEXT[],
  color VARCHAR(7) DEFAULT '#10B981',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 일정
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES therapists(id) ON DELETE SET NULL,
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
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 바우처 정보
CREATE TABLE vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  voucher_type voucher_type NOT NULL,
  voucher_number VARCHAR(50),
  total_sessions INTEGER NOT NULL,
  used_sessions INTEGER DEFAULT 0,
  remaining_sessions INTEGER GENERATED ALWAYS AS (total_sessions - used_sessions) STORED,
  session_price DECIMAL(10, 2),
  government_support DECIMAL(10, 2),
  self_payment DECIMAL(10, 2),
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 결제
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  parent_id UUID REFERENCES parents(id),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  voucher_id UUID REFERENCES vouchers(id),
  payment_type payment_type NOT NULL,
  payment_status payment_status DEFAULT 'unpaid',
  billing_period_start DATE,
  billing_period_end DATE,
  sessions_count INTEGER,
  unit_price DECIMAL(10, 2),
  subtotal DECIMAL(10, 2),
  discount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2),
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  payment_method VARCHAR(50),
  payment_date TIMESTAMPTZ,
  due_date DATE,
  receipt_number VARCHAR(50),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 블로그
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  author_id UUID REFERENCES profiles(id),
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(250) NOT NULL,
  excerpt TEXT,
  content TEXT,
  cover_image_url TEXT,
  seo_title VARCHAR(200),
  seo_description TEXT,
  keywords VARCHAR(200),
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(center_id, slug)
);

-- 상담 문의 (리드)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  parent_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  child_name VARCHAR(100),
  child_birth_year INTEGER,
  child_gender gender_type,
  concern TEXT,
  preferred_service VARCHAR(100)[],
  preferred_time VARCHAR(100),
  status lead_status DEFAULT 'new',
  source VARCHAR(50),
  converted_parent_id UUID REFERENCES parents(id),
  converted_child_id UUID REFERENCES children(id),
  converted_at TIMESTAMPTZ,
  admin_notes TEXT,
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- SECTION 3: SECURITY & RLS (보안 정책 - 순환참조 방지 버전)
-- =================================================================

-- 1. Helper Function: Safe Email Getter
CREATE OR REPLACE FUNCTION public.get_auth_email() RETURNS text AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.email', true), '')::text;
$$ LANGUAGE sql STABLE;

-- 2. Helper Function: Safe Center ID Getter (Bypasses RLS by Security Definer)
CREATE OR REPLACE FUNCTION public.get_my_center_id() 
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT center_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Helper Function: Super Admin Check
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    OR
    public.get_auth_email() = 'admin@zarada.com' -- Change this to your super admin email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on All Tables
ALTER TABLE centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- 🛡️ UNIVERSAL RLS POLICIES (Pattern: Own Center Only)

-- 1. Profiles (Users)
CREATE POLICY "Read Own Profile" ON profiles FOR SELECT USING ( id = auth.uid() );
CREATE POLICY "Super Admin Manage Profiles" ON profiles FOR ALL USING ( public.is_super_admin() );
CREATE POLICY "View Same Center Profiles" ON profiles FOR SELECT USING ( center_id = public.get_my_center_id() );

-- 2. Centers
CREATE POLICY "Public Read Centers" ON centers FOR SELECT USING ( true ); -- Public info needs to be visible

-- 3. Consultations
CREATE POLICY "Super Admin All Access Consultations" ON consultations FOR ALL USING ( public.is_super_admin() );
CREATE POLICY "Center Isolation Consultations" ON consultations FOR ALL USING ( center_id = public.get_my_center_id() );
-- Public can INSERT consultations (Inquiry form)
CREATE POLICY "Public Insert Consultations" ON consultations FOR INSERT WITH CHECK ( true );

-- 4. Schedules
CREATE POLICY "Center Isolation Schedules" ON schedules FOR ALL USING ( center_id = public.get_my_center_id() );

-- 5. Children
CREATE POLICY "Center Isolation Children" ON children FOR ALL USING ( center_id = public.get_my_center_id() );

-- 6. Payments
CREATE POLICY "Center Isolation Payments" ON payments FOR ALL USING ( center_id = public.get_my_center_id() );

-- 7. Leads
CREATE POLICY "Center Isolation Leads" ON leads FOR ALL USING ( center_id = public.get_my_center_id() );
CREATE POLICY "Public Insert Leads" ON leads FOR INSERT WITH CHECK ( true );

-- =================================================================
-- SECTION 3.5: TRIGGERS (자동 업데이트)
-- =================================================================

-- 1. updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 각 테이블에 트리거 적용
CREATE TRIGGER update_centers_updated_at BEFORE UPDATE ON centers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_therapists_updated_at BEFORE UPDATE ON therapists FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON parents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_vouchers_updated_at BEFORE UPDATE ON vouchers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =================================================================
-- SECTION 4: ESSENTIAL RPCs (관리자 기능)
-- =================================================================

-- 1. 사용자 완전 삭제 (with Child Safety)
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 0. SAFETY FIRST: Detach children (부모가 삭제되어도 아이는 남김)
    UPDATE public.children SET parent_id = NULL WHERE parent_id = target_user_id;

    -- 1. Delete profiles
    DELETE FROM public.profiles WHERE id = target_user_id;

    -- 2. Delete auth user
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_user TO authenticated;

-- 2. 회원가입 시 센터 ID/역할 자동 할당 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  default_center_id UUID;
BEGIN
  -- 1. Get the first center ID (For single-center deployment)
  SELECT id INTO default_center_id FROM public.centers LIMIT 1;

  INSERT INTO public.profiles (id, email, name, role, center_id)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', 'New User'),
    'parent',  -- Default Role
    default_center_id
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =================================================================
-- SECTION 5: INITIAL SEED (초기 데이터)
-- =================================================================

-- 기본 센터 생성 (이름을 나중에 바꾸세요)
INSERT INTO centers (name, address, phone, email) 
VALUES ('자라다 아동심리발달센터 (새 지점)', '주소를 입력하세요', '02-000-0000', 'new@zarada.com');

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '🚀 ZARADA ERP Integrated Setup Complete! Ready for deployment.';
END $$;

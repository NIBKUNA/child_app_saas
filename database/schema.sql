-- ============================================
-- 아동발달센터 관리 플랫폼 데이터베이스 스키마
-- Child Development Center Management Platform
-- Database: Supabase (PostgreSQL)
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ENUM Types
-- ============================================

-- 사용자 역할
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'therapist', 'parent');

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

-- ============================================
-- 2. Core Tables
-- ============================================

-- 센터 정보 (다중 센터 지원)
CREATE TABLE centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  business_number VARCHAR(20),        -- 사업자등록번호
  representative VARCHAR(50),          -- 대표자명
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

-- 치료사 상세 정보
CREATE TABLE therapists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL, -- Nullable
  center_id UUID REFERENCES centers(id),
  name VARCHAR(100) NOT NULL,          -- Added
  email VARCHAR(100),                  -- Added
  phone VARCHAR(20),                   -- Added
  specialization VARCHAR(100)[],       -- 전문분야 (언어, 작업, 놀이 등)
  license_number VARCHAR(50),          -- 자격증 번호
  license_type VARCHAR(100),           -- 자격증 유형
  hourly_rate DECIMAL(10, 2),          -- 시급
  color VARCHAR(7) DEFAULT '#3B82F6',  -- 캘린더 표시 색상
  bio TEXT,                            -- 소개
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 부모/보호자 상세 정보
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL, -- Nullable for data-only registration
  center_id UUID REFERENCES centers(id),
  name VARCHAR(100) NOT NULL,          -- Added for direct registration
  phone VARCHAR(20) NOT NULL,          -- Added for direct registration
  email VARCHAR(100),                  -- Added for direct registration
  address TEXT,
  emergency_contact VARCHAR(20),       -- 비상연락처
  relationship VARCHAR(50),            -- 관계 (부, 모, 조부모 등)
  notes TEXT,
  referral_source VARCHAR(100),        -- 의뢰 경로
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
  school_name VARCHAR(100),            -- 학교/어린이집명
  grade VARCHAR(20),                   -- 학년/반
  diagnosis TEXT,                      -- 진단명
  medical_history TEXT,                -- 병력
  notes TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 아동-치료사 연결 (N:M)
CREATE TABLE child_therapist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
  service_type VARCHAR(50),            -- 서비스 유형 (언어치료, 놀이치료 등)
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_primary BOOLEAN DEFAULT FALSE,    -- 주 담당 여부
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, therapist_id, service_type)
);

-- 치료실/룸
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  name VARCHAR(50) NOT NULL,
  capacity INTEGER DEFAULT 1,
  equipment TEXT[],                    -- 비품 목록
  color VARCHAR(7) DEFAULT '#10B981',  -- 캘린더 표시 색상
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2.5 Lead Generation (공개 사이트 상담 문의)
-- ============================================

-- 상담 문의 (리드)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  
  -- 보호자 정보
  parent_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  
  -- 아동 정보
  child_name VARCHAR(100),
  child_birth_year INTEGER,            -- 출생년도
  child_gender gender_type,
  
  -- 문의 내용
  concern TEXT,                        -- 상담 희망 내용
  preferred_service VARCHAR(100)[],    -- 관심 서비스 (언어치료, 놀이치료 등)
  preferred_time VARCHAR(100),         -- 희망 상담 시간
  
  -- 상태 관리
  status lead_status DEFAULT 'new',
  source VARCHAR(50),                  -- 유입 경로 (website, referral, etc.)
  
  -- 전환 시 연결
  converted_parent_id UUID REFERENCES parents(id),
  converted_child_id UUID REFERENCES children(id),
  converted_at TIMESTAMPTZ,
  
  -- 관리자 메모
  admin_notes TEXT,
  assigned_to UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 리드 인덱스
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at DESC);

-- ============================================
-- 3. Scheduling Tables
-- ============================================

-- 일정
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES therapists(id) ON DELETE SET NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  
  title VARCHAR(200),
  service_type VARCHAR(50),            -- 서비스 유형
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  status schedule_status DEFAULT 'scheduled',
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,                -- iCal RRULE 형식
  parent_schedule_id UUID REFERENCES schedules(id), -- 반복 일정의 원본
  
  cancellation_reason TEXT,
  makeup_for_id UUID REFERENCES schedules(id), -- 보강 대상 일정
  
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 일정 인덱스
CREATE INDEX idx_schedules_date ON schedules(start_time, end_time);
CREATE INDEX idx_schedules_therapist ON schedules(therapist_id);
CREATE INDEX idx_schedules_child ON schedules(child_id);
CREATE INDEX idx_schedules_room ON schedules(room_id);
CREATE INDEX idx_schedules_status ON schedules(status);

-- ============================================
-- 4. Clinical Records Tables
-- ============================================

-- 초기 평가
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES therapists(id),
  evaluation_date DATE NOT NULL,
  evaluation_type VARCHAR(100),        -- 평가 유형
  
  -- 평가 영역별 점수/내용
  language_score DECIMAL(5, 2),
  cognitive_score DECIMAL(5, 2),
  motor_score DECIMAL(5, 2),
  social_score DECIMAL(5, 2),
  
  findings TEXT,                       -- 소견
  recommendations TEXT,                -- 권고사항
  goals TEXT,                          -- 치료 목표
  
  attachments TEXT[],                  -- 첨부파일 URL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 상담 기록
CREATE TABLE counseling_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES therapists(id),
  schedule_id UUID REFERENCES schedules(id),
  session_date DATE NOT NULL,
  
  session_number INTEGER,              -- 회차
  duration_minutes INTEGER,
  
  objectives TEXT,                     -- 목표
  activities TEXT,                     -- 활동 내용
  observations TEXT,                   -- 관찰 내용
  child_response TEXT,                 -- 아동 반응
  next_plan TEXT,                      -- 다음 계획
  
  parent_feedback TEXT,                -- 부모 피드백
  attachments TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 진행 노트 (월간/분기 보고)
CREATE TABLE progress_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES therapists(id),
  
  report_period_start DATE,
  report_period_end DATE,
  report_type VARCHAR(50),             -- monthly, quarterly, annual
  
  summary TEXT,                        -- 요약
  progress TEXT,                       -- 진전 사항
  challenges TEXT,                     -- 어려운 점
  goals_achieved TEXT,                 -- 달성 목표
  new_goals TEXT,                      -- 새로운 목표
  recommendations TEXT,                -- 권고사항
  
  attachments TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. Billing & Payment Tables
-- ============================================

-- 바우처 정보
CREATE TABLE vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  voucher_type voucher_type NOT NULL,
  voucher_number VARCHAR(50),          -- 바우처 카드번호
  
  total_sessions INTEGER NOT NULL,     -- 총 세션 수
  used_sessions INTEGER DEFAULT 0,     -- 사용 세션 수
  remaining_sessions INTEGER GENERATED ALWAYS AS (total_sessions - used_sessions) STORED,
  
  session_price DECIMAL(10, 2),        -- 세션당 가격
  government_support DECIMAL(10, 2),   -- 정부 지원금
  self_payment DECIMAL(10, 2),         -- 본인 부담금
  
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
  child_id UUID REFERENCES children(id),
  voucher_id UUID REFERENCES vouchers(id),
  
  payment_type payment_type NOT NULL,
  payment_status payment_status DEFAULT 'unpaid',
  
  billing_period_start DATE,
  billing_period_end DATE,
  
  sessions_count INTEGER,              -- 세션 수
  unit_price DECIMAL(10, 2),           -- 단가
  subtotal DECIMAL(10, 2),             -- 소계
  discount DECIMAL(10, 2) DEFAULT 0,   -- 할인
  total_amount DECIMAL(10, 2),         -- 총액
  paid_amount DECIMAL(10, 2) DEFAULT 0, -- 납부액
  
  payment_method VARCHAR(50),          -- 결제 방법 (카드, 현금, 이체)
  payment_date TIMESTAMPTZ,
  due_date DATE,
  
  receipt_number VARCHAR(50),          -- 영수증 번호
  notes TEXT,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 결제 상세 (세션별)
CREATE TABLE payment_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES schedules(id),
  
  service_type VARCHAR(50),
  service_date DATE,
  unit_price DECIMAL(10, 2),
  quantity INTEGER DEFAULT 1,
  amount DECIMAL(10, 2),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. Communication Tables
-- ============================================

-- 공지사항
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  author_id UUID REFERENCES profiles(id),
  
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50),                -- 카테고리 (일반, 중요, 이벤트)
  
  is_pinned BOOLEAN DEFAULT FALSE,     -- 상단 고정
  is_published BOOLEAN DEFAULT TRUE,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  
  attachments TEXT[],
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 알림장 (치료사 ↔ 부모 소통)
CREATE TABLE daily_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES therapists(id),
  schedule_id UUID REFERENCES schedules(id),
  
  note_date DATE NOT NULL,
  
  -- 치료사 → 부모
  therapist_note TEXT,
  mood VARCHAR(20),                    -- 아동 기분 (좋음, 보통, 힘들어함)
  participation VARCHAR(20),           -- 참여도
  homework TEXT,                       -- 가정 과제
  
  -- 부모 → 치료사
  parent_note TEXT,
  home_observation TEXT,               -- 가정 관찰 내용
  
  attachments TEXT[],
  is_read_by_parent BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 시스템 알림
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  type VARCHAR(50),                    -- schedule, payment, notice, message
  title VARCHAR(200),
  message TEXT,
  link TEXT,                           -- 연결 페이지
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. Analytics & Logs
-- ============================================

-- 활동 로그 (감사 추적)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  center_id UUID REFERENCES centers(id),
  
  action VARCHAR(50),                  -- create, update, delete, view
  entity_type VARCHAR(50),             -- schedule, payment, child, etc.
  entity_id UUID,
  
  old_values JSONB,
  new_values JSONB,
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 예시 정책: 같은 센터 사용자만 데이터 접근 가능
CREATE POLICY "Users can view their center data" ON profiles
  FOR SELECT
  USING (
    center_id IN (
      SELECT center_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 추가 RLS 정책은 역할에 따라 구성 필요

-- ============================================
-- 9. Triggers & Functions
-- ============================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 바우처 세션 사용 시 자동 업데이트
CREATE OR REPLACE FUNCTION update_voucher_sessions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE vouchers
    SET used_sessions = used_sessions + 1
    WHERE id = (
      SELECT voucher_id FROM payments 
      WHERE child_id = NEW.child_id 
      AND is_active = TRUE
      LIMIT 1
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. Sample Data (개발용)
-- ============================================

-- 샘플 센터
INSERT INTO centers (name, address, phone, email) VALUES
('행복아동발달센터', '서울시 강남구 테헤란로 123', '02-1234-5678', 'happy@center.com');

-- 추가 샘플 데이터는 seed.sql 파일로 분리

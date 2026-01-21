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
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  center_id UUID REFERENCES centers(id),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role user_role NOT NULL DEFAULT 'parent',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'active', -- Added for approval system compatibility
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 치료사 상세 정보
CREATE TABLE therapists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE, -- ✨ Updated to CASCADE
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
  profile_id UUID UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE, -- ✨ Updated to CASCADE
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
  inflow_source VARCHAR(100),          -- 유입 경로 (추가됨)
  credit INTEGER DEFAULT 0,            -- 적립금 (선수납 잔액)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✨ [New Import] Family Relationships (Parent-Child Junction for App Logic)
CREATE TABLE family_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE, -- Links to Profile (Auth User)
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  relationship VARCHAR(50) DEFAULT 'parent',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);

-- 초기 상담 신청서 (상담 예약)
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE, -- 기존 아동인 경우 연결 (삭제 시 같이 삭제)
  
  -- 아동 정보 (비회원/신규 포함)
  child_name VARCHAR(100) NOT NULL,
  child_gender gender_type,
  child_birth_date DATE,
  
  -- 상담 내용
  concern TEXT,                        -- 주 호소 문제 (어려움을 보이는 점)
  diagnosis VARCHAR(100),              -- 장애 진단 여부 (예, 아니오, 진행중 등)
  consultation_area VARCHAR(100)[],    -- 희망 상담 영역 (언어, 놀이 등 - 다중 선택 가능)
  
  -- 희망 일정
  preferred_consult_schedule VARCHAR(200), -- 상담 희망 시간 (요일/시간)
  preferred_class_schedule VARCHAR(200),   -- 정규 수업 희망 시간 (요일/시간)
  
  -- 보호자 정보
  guardian_name VARCHAR(100),
  guardian_phone VARCHAR(20),
  guardian_relationship VARCHAR(50),
  
  -- 기타
  inflow_source VARCHAR(100),          -- 내원 경로
  status VARCHAR(20) DEFAULT 'pending', -- pending, scheduled, completed, cancelled
  
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
  assigned_to UUID REFERENCES user_profiles(id),
  
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
  created_by UUID REFERENCES user_profiles(id),
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
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
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
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
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
  
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 결제 상세 (세션별)
CREATE TABLE payment_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  
  service_type VARCHAR(50),
  service_date DATE,
  unit_price DECIMAL(10, 2),
  quantity INTEGER DEFAULT 1,
  amount DECIMAL(10, 2),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5.5 Content Management (Blog)
-- ============================================

CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  author_id UUID REFERENCES user_profiles(id),
  
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(250) NOT NULL,          -- URL-friendly ID (e.g., my-first-post)
  excerpt TEXT,                        -- Short summary for cards/SEO
  content TEXT,                        -- HTML or Markdown content
  cover_image_url TEXT,
  
  -- SEO Metadata
  seo_title VARCHAR(200),
  seo_description TEXT,
  keywords VARCHAR(200),
  
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(center_id, slug)              -- 센터별 슬러그 중복 방지
);

-- Blog Indexes
CREATE INDEX idx_blog_slug ON blog_posts(slug);
CREATE INDEX idx_blog_published ON blog_posts(is_published, published_at DESC);

-- Blog RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. Communication Tables
-- ============================================

-- 공지사항
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID REFERENCES centers(id),
  author_id UUID REFERENCES user_profiles(id),
  
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
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  
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
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  
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
  user_id UUID REFERENCES user_profiles(id),
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
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_relationships ENABLE ROW LEVEL SECURITY; -- ✨ Enabled

-- 예시 정책: 같은 센터 사용자만 데이터 접근 가능
CREATE POLICY "Users can view their center data" ON user_profiles
  FOR SELECT
  USING (
    center_id IN (
      SELECT center_id FROM user_profiles WHERE id = auth.uid()
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
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
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

-- ============================================
-- 11. Additional Features (Admin, Assessments, Reviews, Home Care)
-- ============================================

-- Admin Settings
CREATE TABLE IF NOT EXISTS admin_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES user_profiles(id)
);
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Seed Admin Data
INSERT INTO admin_settings (key, value)
VALUES 
    ('kakao_url', 'https://pf.kakao.com/_example'),
    ('main_banner_url', 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?auto=format&fit=crop&q=80&w=2000'),
    ('notice_text', '센터 소식: 3월 신규 아동 모집 중입니다. (선착순 마감)')
ON CONFLICT (key) DO NOTHING;

-- Development Assessments
CREATE TABLE IF NOT EXISTS development_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    score_communication INTEGER CHECK (score_communication >= 0),
    score_social INTEGER CHECK (score_social >= 0),
    score_cognitive INTEGER CHECK (score_cognitive >= 0),
    score_motor INTEGER CHECK (score_motor >= 0),
    score_adaptive INTEGER CHECK (score_adaptive >= 0),
    evaluation_content TEXT,
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE development_assessments ENABLE ROW LEVEL SECURITY;

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content TEXT NOT NULL,
    parent_name TEXT,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Home Care Tips
CREATE TABLE IF NOT EXISTS home_care_tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    age_group VARCHAR(20) DEFAULT 'all',
    min_score DECIMAL(3, 1) DEFAULT 0,
    max_score DECIMAL(3, 1) DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE home_care_tips ENABLE ROW LEVEL SECURITY;

-- Seed Home Care Tips
INSERT INTO home_care_tips (category, title, content, min_score, max_score) VALUES
('communication', '눈 맞춤 놀이', '아이와 눈높이를 맞추고 "까꿍" 놀이를 하며 눈이 마주칠 때 크게 웃어주세요. 하루 5분씩 반복하면 상호작용 의도가 높아집니다.', 0, 2.5),
('communication', '단어 확장하기', '아이가 "물"이라고 하면 "차가운 물 줄까?"라고 문장을 확장해서 들려주세요. 아이가 단어를 연결하는 데 도움이 됩니다.', 2.6, 5),
('social', '감정 읽어주기', '아이가 떼를 쓸 때 "지금 화가 났구나"라고 감정을 읽어주세요. 자신의 감정을 인식하는 것이 사회성의 첫걸음입니다.', 0, 3.0),
('social', '순서 지키기 놀이', '블록 쌓기를 할 때 "내 차례, 네 차례"를 말하며 턴테이킹(Turn-taking) 연습을 해보세요.', 2.0, 5),
('cognitive', '숨바꼭질 놀이', '좋아하는 장난감을 수건 아래 숨기고 찾아보게 하세요. 대상 영속성 개념 발달에 좋습니다.', 0, 3.0),
('cognitive', '색깔 분류하기', '빨간 공은 빨간 바구니에, 파란 공은 파란 바구니에 넣는 분류 놀이를 함께 해보세요.', 3.0, 5),
('motor', '선 따라 걷기', '바닥에 테이프를 붙이고 그 위를 벗어나지 않고 걷는 연습을 하면 균형 감각이 좋아집니다.', 0, 4.0),
('motor', '빨래집게 놀이', '소근육 발달을 위해 빨래집게를 옷이나 종이에 꽂는 놀이를 해보세요. 손가락 힘 조절에 탁월합니다.', 0, 5),
('adaptive', '스스로 숟가락질', '흘리더라도 스스로 숟가락으로 밥을 먹도록 격려해주세요. 성취감이 자조 기술 발달의 원동력입니다.', 0, 3.0),
('adaptive', '옷 입기 도와주기', '바지 입을 때 발을 넣는 것만 아이가 하게 하고, 점차 아이가 하는 비중을 늘려가세요.', 2.0, 5);

-- Parent Observations
CREATE TABLE IF NOT EXISTS parent_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES auth.users(id),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    observation_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE parent_observations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 12. Essential Security & Automation
-- ============================================

-- A. User Profile Creation Policy
-- Allow new authenticated users to insert their *own* profile.
CREATE POLICY "Users can create own profile" ON user_profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- B. Super Admin Automation
-- Ensure 'anukbin@gmail.com' is always admin/active.
CREATE OR REPLACE FUNCTION public.enforce_super_admin()
RETURNS TRIGGER AS $$
BEGIN
    IF LOWER(NEW.email) = 'anukbin@gmail.com' THEN
        NEW.role := 'admin';
        NEW.status := 'active';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_super_admin_trigger ON user_profiles;
CREATE TRIGGER enforce_super_admin_trigger
    BEFORE INSERT OR UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_super_admin();

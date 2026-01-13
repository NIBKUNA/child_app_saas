-- ==========================================
-- SaaS Integrity & Multi-tenancy Migration
-- ==========================================

-- 1. admin_settings 테이블 고도화 (센터별 격리)
-- center_id 컬럼 추가 (기존 데이터 호환성을 위해 Nullable로 시작)
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS center_id UUID REFERENCES centers(id) ON DELETE CASCADE;

-- 기존 PK 제거 (key만으로는 유일성 보장 불가)
ALTER TABLE admin_settings DROP CONSTRAINT IF EXISTS admin_settings_pkey;

-- center_id가 NULL인 경우를 방지하기 위해, 기존 데이터 처리 (선택사항, 일단 유지)
-- 만약 기존 시스템이 단일 센터였다면, 임의의 센터 ID로 업데이트 필요할 수 있음.
-- 여기서는 일단 복합키로 변경. (center_id, key) 조합이 Unique해야 함.
-- center_id가 NULL인 글로벌 설정도 허용할지 정책 결정 필요.
-- SaaS 정책상 "모든 설정은 센터 귀속"이므로, center_id Not Null을 권장하나,
-- 마이그레이션 과도기를 위해 일단 Nullable + Unique Index 사용.

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_settings_center_key ON admin_settings (center_id, key);

-- RLS 활성화
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- 정책: 내 센터의 설정만 조회/수정 가능
DROP POLICY IF EXISTS "View own center settings" ON admin_settings;
CREATE POLICY "View own center settings" ON admin_settings
FOR SELECT
USING (
  center_id IN (SELECT center_id FROM profiles WHERE id = auth.uid()) 
  OR center_id IS NULL -- 글로벌 기본값 조회 허용 (옵션)
);

DROP POLICY IF EXISTS "Manage own center settings" ON admin_settings;
CREATE POLICY "Manage own center settings" ON admin_settings
FOR ALL
USING (center_id IN (SELECT center_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (center_id IN (SELECT center_id FROM profiles WHERE id = auth.uid()));


-- 2. home_care_tips 테이블 생성 (지능형 팁)
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
DROP POLICY IF EXISTS "Public read tips" ON home_care_tips;
CREATE POLICY "Public read tips" ON home_care_tips FOR SELECT USING (true);

-- Seed Data (중복 방지)
INSERT INTO home_care_tips (category, title, content, min_score, max_score)
SELECT 'communication', '눈 맞춤 놀이', '아이와 눈높이를 맞추고 "까꿍" 놀이를 하며 눈이 마주칠 때 크게 웃어주세요.', 0, 2.5
WHERE NOT EXISTS (SELECT 1 FROM home_care_tips WHERE title = '눈 맞춤 놀이');

INSERT INTO home_care_tips (category, title, content, min_score, max_score)
SELECT 'social', '감정 읽어주기', '아이가 떼를 쓸 때 "지금 화가 났구나"라고 감정을 읽어주세요.', 0, 3.0
WHERE NOT EXISTS (SELECT 1 FROM home_care_tips WHERE title = '감정 읽어주기');

-- (Add more seeds as needed following the pattern)


-- 3. parent_observations 테이블 확인 및 권한 설정
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

-- Policy: Parents own rows
DROP POLICY IF EXISTS "Parents view own" ON parent_observations;
CREATE POLICY "Parents view own" ON parent_observations
FOR SELECT USING (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Parents insert own" ON parent_observations;
CREATE POLICY "Parents insert own" ON parent_observations
FOR INSERT WITH CHECK (auth.uid() = parent_id);

-- Policy: Therapists view items appearing in their center's children list
DROP POLICY IF EXISTS "Therapists view center" ON parent_observations;
CREATE POLICY "Therapists view center" ON parent_observations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM children c
    JOIN therapists t ON t.center_id = c.center_id
    WHERE c.id = parent_observations.child_id
    AND t.profile_id = auth.uid()
  )
);

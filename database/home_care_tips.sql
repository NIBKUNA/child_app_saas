-- 1. 홈 케어 팁 테이블 생성
CREATE TABLE IF NOT EXISTS home_care_tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL, -- communication, social, cognitive, motor, adaptive
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    age_group VARCHAR(20) DEFAULT 'all', -- toddler, child, all
    min_score DECIMAL(3, 1) DEFAULT 0,
    max_score DECIMAL(3, 1) DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE home_care_tips ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능 (public)
CREATE POLICY "Anyone can read tips" ON home_care_tips FOR SELECT USING (true);


-- 2. 관찰 일기 테이블 생성 (Missing Table Restoration)
CREATE TABLE IF NOT EXISTS parent_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES auth.users(id), -- or profiles(id)
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    observation_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE parent_observations ENABLE ROW LEVEL SECURITY;

-- 부모는 자신의 글을 볼 수 있음
CREATE POLICY "Parents can view own observations" ON parent_observations
FOR SELECT USING (auth.uid() = parent_id);

-- 부모는 자신의 글을 작성할 수 있음
CREATE POLICY "Parents can insert own observations" ON parent_observations
FOR INSERT WITH CHECK (auth.uid() = parent_id);


-- 3. 관찰 일기 치료사 조회 권한 추가 (Linked via Child Center)
-- center_id가 없을 수 있으므로 children 테이블을 통해 연결
CREATE POLICY "Therapists can view center observations" ON parent_observations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM children
    WHERE children.id = parent_observations.child_id
    AND children.center_id IN (
        SELECT center_id FROM therapists WHERE profile_id = auth.uid()
    )
  )
);


-- 4. 초기 데이터 시딩 (Seed Data for Tips)
INSERT INTO home_care_tips (category, title, content, min_score, max_score) VALUES
-- 의사소통 (Communication)
('communication', '눈 맞춤 놀이', '아이와 눈높이를 맞추고 "까꿍" 놀이를 하며 눈이 마주칠 때 크게 웃어주세요. 하루 5분씩 반복하면 상호작용 의도가 높아집니다.', 0, 2.5),
('communication', '단어 확장하기', '아이가 "물"이라고 하면 "차가운 물 줄까?"라고 문장을 확장해서 들려주세요. 아이가 단어를 연결하는 데 도움이 됩니다.', 2.6, 5),

-- 사회성 (Social)
('social', '감정 읽어주기', '아이가 떼를 쓸 때 "지금 화가 났구나"라고 감정을 읽어주세요. 자신의 감정을 인식하는 것이 사회성의 첫걸음입니다.', 0, 3.0),
('social', '순서 지키기 놀이', '블록 쌓기를 할 때 "내 차례, 네 차례"를 말하며 턴테이킹(Turn-taking) 연습을 해보세요.', 2.0, 5),

-- 인지 (Cognitive)
('cognitive', '숨바꼭질 놀이', '좋아하는 장난감을 수건 아래 숨기고 찾아보게 하세요. 대상 영속성 개념 발달에 좋습니다.', 0, 3.0),
('cognitive', '색깔 분류하기', '빨간 공은 빨간 바구니에, 파란 공은 파란 바구니에 넣는 분류 놀이를 함께 해보세요.', 3.0, 5),

-- 대/소근육 (Motor)
('motor', '선 따라 걷기', '바닥에 테이프를 붙이고 그 위를 벗어나지 않고 걷는 연습을 하면 균형 감각이 좋아집니다.', 0, 4.0),
('motor', '빨래집게 놀이', '소근육 발달을 위해 빨래집게를 옷이나 종이에 꽂는 놀이를 해보세요. 손가락 힘 조절에 탁월합니다.', 0, 5),

-- 자조/적응 (Adaptive)
('adaptive', '스스로 숟가락질', '흘리더라도 스스로 숟가락으로 밥을 먹도록 격려해주세요. 성취감이 자조 기술 발달의 원동력입니다.', 0, 3.0),
('adaptive', '옷 입기 도와주기', '바지 입을 때 발을 넣는 것만 아이가 하게 하고, 점차 아이가 하는 비중을 늘려가세요.', 2.0, 5);

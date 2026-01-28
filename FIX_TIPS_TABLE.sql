
BEGIN;

-- 1. Create home_care_tips table
CREATE TABLE IF NOT EXISTS public.home_care_tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- communication, social, cognitive, motor, adaptive
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Seed some data (to show it working)
INSERT INTO public.home_care_tips (category, title, content)
VALUES 
('communication', '말놀이를 해보세요', '아이와 함께 의성어, 의태어가 많이 들어간 동화책을 읽으며 따라 말하도록 유도해보세요.'),
('communication', '선택하기 기회 주기', '간식을 줄 때 "우유 줄까, 주스 줄까?"라고 물으며 대답을 기다려주세요.'),
('social', '눈 맞춤 놀이', '아이와 마주 보고 앉아 눈이 마주칠 때 까꿍 놀이를 하거나 스티커를 얼굴에 붙여보세요.'),
('social', '차례 지키기', '장난감을 주고받으며 "내 차례, 네 차례"라고 말하며 순서 개념을 익히게 도와주세요.'),
('cognitive', '숨바꼭질 놀이', '좋아하는 장난감을 수건 아래 숨기고 아이가 찾아내도록 격려해주세요.'),
('visual', '같은 그림 찾기', '같은 그림 카드를 두 장씩 준비해 짝을 맞추는 놀이를 함께 해보세요.'), -- 'visual' might map to cognitive
('motor', '선 따라 걷기', '바닥에 테이프를 붙여 선을 만들고, 그 위를 벗어나지 않게 걷는 놀이를 해보세요.'),
('motor', '빨대 목걸이 만들기', '빨대를 잘라 끈에 끼우며 소근육 조절 능력을 키워주세요.'),
('adaptive', '스스로 양말 신기', '외출 전 아이가 스스로 양말을 신어보도록 시간을 충분히 주고 격려해주세요.');

COMMIT;

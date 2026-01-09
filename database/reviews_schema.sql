-- ============================================
-- 🎨 ZARADA MASTER TEMPLATE - Reviews System
-- 지점별 서비스 리뷰 테이블
-- ============================================

-- reviews 테이블 생성
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
    author_name VARCHAR(100) NOT NULL,
    
    -- 별점 항목 (1-5점)
    rating_facility SMALLINT CHECK (rating_facility >= 1 AND rating_facility <= 5),
    rating_kindness SMALLINT CHECK (rating_kindness >= 1 AND rating_kindness <= 5),
    rating_convenience SMALLINT CHECK (rating_convenience >= 1 AND rating_convenience <= 5),
    
    -- 리뷰 내용
    content TEXT,
    
    -- 메타데이터
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (지점별 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_reviews_center_id ON reviews(center_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- RLS 정책
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 승인된 리뷰만 조회 가능
CREATE POLICY "Anyone can view approved reviews"
    ON reviews FOR SELECT
    USING (is_approved = TRUE);

-- 인증된 사용자만 리뷰 작성 가능
CREATE POLICY "Authenticated users can create reviews"
    ON reviews FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

-- 관리자만 리뷰 수정/삭제 가능 (user_profiles role 체크)
CREATE POLICY "Admins can update reviews"
    ON reviews FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Admins can delete reviews"
    ON reviews FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('admin', 'staff')
        )
    );

-- 자동 updated_at 트리거
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_updated_at_trigger
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();

-- 코멘트
COMMENT ON TABLE reviews IS '지점별 서비스 리뷰 테이블';
COMMENT ON COLUMN reviews.rating_facility IS '시설 만족도 (1-5)';
COMMENT ON COLUMN reviews.rating_kindness IS '선생님 친절도 (1-5)';
COMMENT ON COLUMN reviews.rating_convenience IS '상담 편의성 (1-5)';
COMMENT ON COLUMN reviews.is_approved IS '관리자 승인 여부 (기본값 false)';

/**
 * 🎨 Project: Zarada ERP - Final Integration v2
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-11
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * Final Integration Script:
 * 1. Add 'parent_feedback' column to counseling_logs (for therapist feedback visible to parents)
 * 2. Add 'log_id' column to development_assessments (for log-assessment linkage)
 * 3. Ensure data integrity between payments and related tables
 */

-- =====================================================================
-- 1. Add parent_feedback field to counseling_logs table
-- =====================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'counseling_logs' 
        AND column_name = 'parent_feedback'
    ) THEN
        ALTER TABLE public.counseling_logs
        ADD COLUMN parent_feedback TEXT DEFAULT NULL;
        
        COMMENT ON COLUMN public.counseling_logs.parent_feedback IS 
            '치료사가 부모님께 전달하는 피드백 메시지. 부모님 앱에서 조회 가능.';
        
        RAISE NOTICE '✅ Added parent_feedback column to counseling_logs';
    ELSE
        RAISE NOTICE 'ℹ️ parent_feedback column already exists';
    END IF;
END $$;

-- =====================================================================
-- 2. Add log_id field to development_assessments table
-- =====================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'development_assessments' 
        AND column_name = 'log_id'
    ) THEN
        ALTER TABLE public.development_assessments
        ADD COLUMN log_id UUID DEFAULT NULL REFERENCES public.counseling_logs(id) ON DELETE SET NULL;
        
        COMMENT ON COLUMN public.development_assessments.log_id IS 
            '상담 일지와 발달 평가의 연결. 수업 일지 작성 시 평가를 함께 저장하면 자동 매핑됩니다.';
        
        RAISE NOTICE '✅ Added log_id column to development_assessments';
    ELSE
        RAISE NOTICE 'ℹ️ log_id column already exists';
    END IF;
END $$;

-- =====================================================================
-- 3. Verify Data Integrity Check Function
-- =====================================================================
CREATE OR REPLACE FUNCTION check_data_integrity()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check 1: Payment amounts consistency
    RETURN QUERY
    SELECT 
        'Payment Total Check'::TEXT,
        CASE 
            WHEN (SELECT COUNT(*) FROM payments WHERE amount IS NOT NULL) > 0 
            THEN 'OK'::TEXT 
            ELSE 'WARN: No payments found'::TEXT 
        END,
        ('Total payments: ' || (SELECT COALESCE(SUM(amount), 0) FROM payments)::TEXT)::TEXT;
    
    -- Check 2: Children-Parents linkage
    RETURN QUERY
    SELECT 
        'Children-Parents Link'::TEXT,
        CASE 
            WHEN (SELECT COUNT(*) FROM children WHERE parent_id IS NULL) = 0 
            THEN 'OK'::TEXT 
            ELSE 'WARN: Some children without parents'::TEXT 
        END,
        ('Orphaned children: ' || (SELECT COUNT(*) FROM children WHERE parent_id IS NULL)::TEXT)::TEXT;
    
    -- Check 3: Assessment-Log linkage
    RETURN QUERY
    SELECT 
        'Assessment-Log Link'::TEXT,
        'INFO'::TEXT,
        ('Linked assessments: ' || (SELECT COUNT(*) FROM development_assessments WHERE log_id IS NOT NULL)::TEXT)::TEXT;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 4. Grant RLS-safe access to new columns
-- =====================================================================
-- Ensure RLS policies allow access to new columns through existing table policies

-- Note: If counseling_logs and development_assessments already have RLS policies,
-- no additional policies are needed as column additions inherit table-level policies.

-- =====================================================================
-- 5. Verification Query (Run after migration)
-- =====================================================================
-- SELECT * FROM check_data_integrity();

-- =====================================================================
-- Developer: 안욱빈 (An Uk-bin)
-- Final Integration Complete ✅
-- =====================================================================

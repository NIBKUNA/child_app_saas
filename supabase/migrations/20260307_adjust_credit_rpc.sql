-- ✨ 이월금(Credit) 원자적 증감 RPC 함수
-- Race Condition 방지: select → update 2단계를 1단계 원자적 연산으로 대체
-- 
-- 사용법:
--   증가: supabase.rpc('adjust_credit', { p_child_id: '...', p_amount: 50000 })
--   차감: supabase.rpc('adjust_credit', { p_child_id: '...', p_amount: -50000 })
--
-- 반환값: 변경 후 새로운 credit 잔액 (INTEGER)
-- 안전장치: GREATEST(0, ...) — 잔액이 음수가 되지 않도록 보장

CREATE OR REPLACE FUNCTION adjust_credit(
  p_child_id UUID,
  p_amount INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER  -- RLS 정책 우회하여 항상 실행 가능
AS $$
DECLARE
  new_credit INTEGER;
BEGIN
  UPDATE children
  SET credit = GREATEST(0, COALESCE(credit, 0) + p_amount)
  WHERE id = p_child_id
  RETURNING credit INTO new_credit;

  -- 대상 아동이 없는 경우 예외 발생 (잘못된 ID 방어)
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Child not found: %', p_child_id;
  END IF;

  RETURN COALESCE(new_credit, 0);
END;
$$;

-- 함수 실행 권한 부여 (인증된 사용자, 서비스 역할)
GRANT EXECUTE ON FUNCTION adjust_credit(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION adjust_credit(UUID, INTEGER) TO service_role;

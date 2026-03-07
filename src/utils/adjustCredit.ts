import { supabase } from '@/lib/supabase';

/**
 * ✨ 이월금(Credit) 원자적 증감 유틸리티
 * 
 * 기존 select → update 2단계 패턴은 동시 작업 시 Race Condition 발생.
 * 이 함수는 Supabase RPC를 통해 PostgreSQL 레벨에서 원자적으로 처리합니다.
 * 
 * @param childId - 대상 아동의 UUID
 * @param amount  - 증감액 (양수: 적립, 음수: 차감)
 * @returns 변경 후 새로운 credit 잔액
 * 
 * @example
 * // 이월금 5만원 적립
 * await adjustCredit('child-uuid', 50000);
 * 
 * // 이월금 3만원 차감
 * await adjustCredit('child-uuid', -30000);
 */
export async function adjustCredit(childId: string, amount: number): Promise<number> {
    if (!childId || amount === 0) return 0;

    const { data, error } = await (supabase.rpc as any)('adjust_credit', {
        p_child_id: childId,
        p_amount: amount,
    });

    if (error) {
        console.error('[adjustCredit] RPC 실패:', error);
        throw new Error(`이월금 변경 실패: ${error.message}`);
    }

    return data ?? 0;
}

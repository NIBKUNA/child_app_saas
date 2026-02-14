/**
 * ✨ useAutoCompleteSchedules
 * 앱 진입 시 1회 실행: 과거 'scheduled' 상태의 수업을 'completed'로 자동 전환
 * 기존에 Schedule.tsx, Settlement.tsx에 산발적으로 있던 로직을 중앙화
 */
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export function useAutoCompleteSchedules(centerId: string | undefined) {
    const hasRun = useRef(false);

    useEffect(() => {
        if (!centerId || hasRun.current) return;

        const autoComplete = async () => {
            try {
                const now = new Date().toISOString();

                // 과거 시간이 지난 'scheduled' 상태의 수업을 모두 'completed'로 변경
                const { data: pastScheduled, error: fetchError } = await supabase
                    .from('schedules')
                    .select('id')
                    .eq('center_id', centerId)
                    .eq('status', 'scheduled')
                    .lt('end_time', now);

                if (fetchError) {
                    console.error('[AutoComplete] 조회 실패:', fetchError);
                    return;
                }

                if (pastScheduled && pastScheduled.length > 0) {
                    const ids = pastScheduled.map(s => s.id);
                    const { error: updateError } = await supabase
                        .from('schedules')
                        .update({ status: 'completed' } as never)
                        .in('id', ids);

                    if (updateError) {
                        console.error('[AutoComplete] 업데이트 실패:', updateError);
                    } else {
                        console.log(`[AutoComplete] ${ids.length}건의 수업이 자동 완료 처리됨`);
                    }
                }

                hasRun.current = true;
            } catch (err) {
                console.error('[AutoComplete] 오류:', err);
            }
        };

        autoComplete();
    }, [centerId]);
}

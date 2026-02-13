/**
 * ✨ [Timezone Helpers]
 * TIMESTAMPTZ 값을 로컬 시간/날짜로 변환하는 유틸리티
 * PostgreSQL TIMESTAMPTZ는 UTC로 저장되므로, 표시 시 로컬(KST) 변환 필요
 */

/** TIMESTAMPTZ ISO 문자열 → 로컬 날짜 "YYYY-MM-DD" */
export const toLocalDateStr = (isoStr: string | null | undefined): string => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr.slice(0, 10);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** TIMESTAMPTZ ISO 문자열 → 로컬 시간 "HH:MM" */
export const toLocalTimeStr = (isoStr: string | null | undefined): string | null => {
    if (!isoStr) return null;
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr.includes('T') ? isoStr.split('T')[1].slice(0, 5) : null;
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

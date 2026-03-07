/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-11
 * 🖋️ Description: Unified Comprehensive Report Generator
 * -----------------------------------------------------------
 */
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

// Helper: Format Date
const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString.slice(0, 10);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

interface AssessmentDetails {
    communication?: any[];
    social?: any[];
    cognitive?: any[];
    motor?: any[];
    adaptive?: any[];
    [key: string]: any[] | undefined;
}

// Helper: Flatten Assessment Details
const formatEvidenceDetailed = (details: AssessmentDetails | null | undefined) => {
    if (!details || Object.keys(details).length === 0) return '평가 근거 없음';
    const summary = [];
    if (details.communication?.length) summary.push(`[언어] ${details.communication.length}개 항목 달성`);
    if (details.social?.length) summary.push(`[사회] ${details.social.length}개 항목 달성`);
    if (details.cognitive?.length) summary.push(`[인지] ${details.cognitive.length}개 항목 달성`);
    if (details.motor?.length) summary.push(`[운동] ${details.motor.length}개 항목 달성`);
    if (details.adaptive?.length) summary.push(`[자조] ${details.adaptive.length}개 항목 달성`);
    return summary.join('\n');
};

export const generateIntegratedReport = async (selectedMonth: string, centerId: string) => {
    try {
        if (!centerId) throw new Error("Center ID is required for report generation.");

        // Time Range Setup (✨ payment_month 기준 사용으로 날짜 파싱 불필요)

        // ------------------------------------------------------------------
        // 1. Fetch Data (Parallel Requests for Performance)
        // ------------------------------------------------------------------

        // ✨ [FIX] 월 범위 계산 (start_time 기준)
        const [selYear, selMonth] = selectedMonth.split('-').map(Number);
        const lastDay = new Date(selYear, selMonth, 0).getDate();
        const monthStart = `${selectedMonth}-01`;
        const monthEnd = `${selectedMonth}-${String(lastDay).padStart(2, '0')}T23:59:59`;

        const [
            { data: children },
            { data: profilesData },
            { data: assessments },
            { data: payments },
            { data: consultations },
            { data: staff },
            { data: schedules }
        ] = await Promise.all([
            // 1. Children (Master List)
            supabase.from('children').select(`
                id, name, gender, birth_date, is_active, status, created_at, parent_id,
                profiles:user_profiles ( name, email )
            `).eq('center_id', centerId),
            // 2. Profiles (Phone Numbers)
            supabase.from('user_profiles').select('id, phone').eq('center_id', centerId),
            // 3. Assessments (Latest)
            supabase.from('development_assessments').select('*').eq('center_id', centerId).order('evaluation_date', { ascending: false }),
            // 4. Payments (Selected Month) — payment_month 기준 통일
            supabase.from('payments').select('*').eq('center_id', centerId).eq('payment_month', selectedMonth),
            // 5. Consultations (Marketing) — ✨ [FIX] leads → consultations (Dashboard와 통일)
            supabase.from('consultations').select('*').eq('center_id', centerId).order('created_at', { ascending: false }),
            // 6. Staff (User Profiles with roles)
            supabase.from('user_profiles').select('*').eq('center_id', centerId).in('role', ['admin', 'therapist', 'super_admin']),
            // 7. Schedules — ✨ [FIX] date → start_time 기준 (date는 nullable이라 0건 반환됨)
            supabase.from('schedules').select('id, status, start_time, child_id')
                .eq('center_id', centerId)
                .gte('start_time', monthStart)
                .lte('start_time', monthEnd)
        ]);

        // ------------------------------------------------------------------
        // 2. Process Data Maps & Aggregations
        // ------------------------------------------------------------------

        // Map: Phone Numbers
        const phoneMap = new Map<string, string>();
        (profilesData || []).forEach((p: any) => { if (p.phone) phoneMap.set(p.id, p.phone); });

        // Map: Latest Assessment per Child
        const assessmentMap = new Map();
        (assessments || []).forEach((a: { child_id: string | null }) => {
            if (a.child_id && !assessmentMap.has(a.child_id)) assessmentMap.set(a.child_id, a);
        });

        // Map: Payment Aggregation — ✨ [FIX] credit_used 포함 (수납 관리/대시보드와 통일)
        const paymentMap = new Map<string, number>();
        let totalRevenue = 0;
        (payments || []).forEach((p: any) => {
            const amount = (Number(p.amount) || 0) + (Number(p.credit_used) || 0);
            const current = paymentMap.get(p.child_id) || 0;
            paymentMap.set(p.child_id, current + amount);
            totalRevenue += amount;
        });

        // KPI Calculations
        const activeChildrenCount = (children || []).filter((c: { status?: string | null; is_active?: boolean | null }) =>
            c.status === 'active' || (!c.status && c.is_active !== false)
        ).length;
        const newChildrenCount = (children || []).filter((c: { created_at: string | null }) => c.created_at?.startsWith(selectedMonth)).length;

        const sessionStats = { completed: 0, cancelled: 0, scheduled: 0, total: 0 };
        (schedules || []).forEach((s: { status: string | null }) => {
            sessionStats.total++;
            if (s.status === 'completed') sessionStats.completed++;
            else if (s.status === 'cancelled') sessionStats.cancelled++;
            else if (s.status === 'scheduled') sessionStats.scheduled++;
        });

        // ------------------------------------------------------------------
        // 3. Build Sheet Data
        // ------------------------------------------------------------------

        // Sheet 1: Dashboard KPI
        const dashboardData = [
            { 'Category': 'Financial', 'Metric': '총 매출 (Revenue)', 'Value': totalRevenue, 'Unit': 'KRW' },
            { 'Category': 'Growth', 'Metric': '활성 아동 수 (Active Members)', 'Value': activeChildrenCount, 'Unit': '명' },
            { 'Category': 'Growth', 'Metric': '신규 등록 (New Members)', 'Value': newChildrenCount, 'Unit': '명' },
            { 'Category': 'Operations', 'Metric': '총 수업 수 (Total Sessions)', 'Value': sessionStats.total, 'Unit': '건' },
            { 'Category': 'Operations', 'Metric': '수업 완료 (Completed)', 'Value': sessionStats.completed, 'Unit': '건' },
            { 'Category': 'Operations', 'Metric': '수업 취소 (Cancelled)', 'Value': sessionStats.cancelled, 'Unit': '건' },
            { 'Category': 'Operations', 'Metric': '예약됨 (Scheduled)', 'Value': sessionStats.scheduled, 'Unit': '건' },
        ];

        // Sheet 2: Marketing Intelligence — ✨ [FIX] leads → consultations (Dashboard와 통일)
        const marketingData = (consultations || []).map((c: any) => ({
            '접수일': formatDate(c.created_at),
            '보호자명': c.guardian_name || '-',
            '아동명': c.child_name || '-',
            '연락처': c.guardian_phone || '-',
            '관심 영역': (c.consultation_area || []).join(', ') || c.concern || '-',
            '유입 경로': c.marketing_source || c.inflow_source || '-',
            '상태': c.status || '-',
            '보호자 관계': c.guardian_relationship || '-',
            '진단명': c.diagnosis || '-',
            '비고': c.notes || '-'
        }));

        // Sheet 3: Staff Information
        const staffData = (staff || []).map((s: { name: string | null; role: string; email: string; status: string | null; created_at: string | null }) => ({
            '이름': s.name || '-',
            '역할': s.role,
            '이메일': s.email,
            '상태': s.status || 'active',
            '입사일': formatDate(s.created_at)
        }));

        // Sheet 4: Payment Details — ✨ [FIX] 실제 스키마에 맞게 수정 (status/description 제거 → memo 사용)
        const paymentDetailData = (payments || []).map((p: any) => {
            const childName = (children || []).find((c: { id: string; name: string }) => c.id === p.child_id)?.name || 'Unknown';
            return {
                '결제일시': p.paid_at ? new Date(p.paid_at).toLocaleString() : '-',
                '아동명': childName,
                '결제금액': Number(p.amount) || 0,
                '크레딧사용': Number(p.credit_used) || 0,
                '합계': (Number(p.amount) || 0) + (Number(p.credit_used) || 0),
                '결제수단': p.method || '-',
                '메모': p.memo || '-'
            };
        });

        // Sheet 5: Integrated Master (Existing Logic)
        const masterData = (children || []).map((child: { id: string; name: string; birth_date: string; gender: string | null; status?: string | null; is_active?: boolean | null; parent_id: string | null; profiles: { name: string | null; email: string }[] }) => {
            const guardianBase = child.profiles?.[0] || { name: '-', email: '-' };
            const guardianPhone = phoneMap.get(child.parent_id || '') || '-';
            const assess = assessmentMap.get(child.id);
            const totalPay = paymentMap.get(child.id) || 0;
            const genderMap: Record<string, string> = { 'male': '남', 'female': '여', 'other': '-' };
            const statusLabel = child.status === 'active' ? '이용중' : child.status === 'waiting' ? '대기' : child.status === 'inactive' ? '종결' : (child.is_active ? '이용중' : '종결');

            return {
                'ID': child.id,
                '아동명': child.name,
                '생년월일': child.birth_date,
                '성별': genderMap[child.gender || ''] || child.gender || '-',
                '상태': statusLabel,
                '보호자명': guardianBase.name || '-',
                '연락처': guardianPhone,
                '이번달 결제액': totalPay,
                '언어(점)': assess?.score_communication || 0,
                '사회(점)': assess?.score_social || 0,
                '인지(점)': assess?.score_cognitive || 0,
                '운동(점)': assess?.score_motor || 0,
                '자조(점)': assess?.score_adaptive || 0,
                '종합 소견': assess?.summary || '-',
                '평가 상세': formatEvidenceDetailed(assess?.assessment_details),
                '최근 평가일': formatDate(assess?.evaluation_date),
            };
        });

        // ------------------------------------------------------------------
        // 4. Generate Excel Workbook
        // ------------------------------------------------------------------
        const wb = XLSX.utils.book_new();

        // Helper to add sheet with auto-width
        const addSheet = (data: any[], name: string) => {
            const ws = XLSX.utils.json_to_sheet(data);
            if (data.length > 0) {
                const wscols = Object.keys(data[0]).map(k => ({ wch: Math.max(k.length * 2, 15) }));
                ws['!cols'] = wscols;
            }
            XLSX.utils.book_append_sheet(wb, ws, name);
        };

        addSheet(dashboardData, '1.대시보드 KPI');
        addSheet(marketingData, '2.마케팅 지능');
        addSheet(staffData, '3.직원 정보');
        addSheet(paymentDetailData, '4.수납 내역 상세');
        addSheet(masterData, '5.통합 리포트');

        // Export
        const fileName = `Zarada_Comprehensive_Report_${selectedMonth}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`;
        XLSX.writeFile(wb, fileName);

        return { success: true, count: masterData.length };

    } catch (error: any) {
        console.error('Report Generation Error:', error);
        alert(`리포트 생성 실패: ${error.message}`);
        return { success: false, error: error.message };
    }
};

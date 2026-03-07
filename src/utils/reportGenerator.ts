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

// Helper: 월 한글 표시
const formatMonthKR = (month: string) => {
    const [y, m] = month.split('-');
    return `${y}년 ${Number(m)}월`;
};

export const generateIntegratedReport = async (selectedMonth: string, centerId: string) => {
    try {
        if (!centerId) throw new Error("Center ID is required for report generation.");

        // ✨ [FIX] 월 범위 계산 (start_time 기준)
        const [selYear, selMonth] = selectedMonth.split('-').map(Number);
        const lastDay = new Date(selYear, selMonth, 0).getDate();
        const monthStart = `${selectedMonth}-01`;
        const monthEnd = `${selectedMonth}-${String(lastDay).padStart(2, '0')}T23:59:59`;

        // ------------------------------------------------------------------
        // 1. Fetch Data (Parallel Requests for Performance)
        // ------------------------------------------------------------------
        const [
            childrenResult,
            profilesResult,
            assessmentsResult,
            paymentsResult,
            staffResult,
            schedulesResult,
            siteVisitsResult
        ] = await Promise.all([
            // 1. Children — ✨ [FIX] user_profiles 조인 제거 (ambiguous FK 문제)
            supabase.from('children').select(
                'id, name, gender, birth_date, is_active, status, created_at, parent_id'
            ).eq('center_id', centerId),
            // 2. Profiles (Phone + Name for Guardian lookup)
            supabase.from('user_profiles').select('id, name, email, phone').eq('center_id', centerId),
            // 3. Assessments (Latest)
            supabase.from('development_assessments').select('*').eq('center_id', centerId).order('evaluation_date', { ascending: false }),
            // 4. Payments (Selected Month) — payment_month 기준 통일
            supabase.from('payments').select('*').eq('center_id', centerId).eq('payment_month', selectedMonth),
            // 5. Staff (User Profiles with roles)
            supabase.from('user_profiles').select('*').eq('center_id', centerId).in('role', ['admin', 'therapist', 'super_admin']),
            // 7. Schedules
            supabase.from('schedules').select('id, status, start_time, child_id')
                .eq('center_id', centerId)
                .gte('start_time', monthStart)
                .lte('start_time', monthEnd),
            // 8. ✨ [NEW] Site Visits (마케팅 유입 데이터)
            supabase.from('site_visits').select('source_category, visited_at, utm_source, utm_medium, utm_campaign')
                .eq('center_id', centerId)
                .gte('visited_at', monthStart)
                .lte('visited_at', monthEnd)
        ]);

        const children = childrenResult.data || [];
        const profilesData = profilesResult.data || [];
        const assessments = assessmentsResult.data || [];
        const payments = paymentsResult.data || [];
        const staff = staffResult.data || [];
        const schedules = schedulesResult.data || [];
        const siteVisits = siteVisitsResult.data || [];

        // ------------------------------------------------------------------
        // 2. Process Data Maps & Aggregations
        // ------------------------------------------------------------------

        // Map: Phone + Name by user ID (for guardian lookup)
        const profileMap = new Map<string, { name: string; email: string; phone: string }>();
        profilesData.forEach((p: any) => {
            profileMap.set(p.id, { name: p.name || '-', email: p.email || '-', phone: p.phone || '-' });
        });

        // Map: Latest Assessment per Child
        const assessmentMap = new Map();
        assessments.forEach((a: { child_id: string | null }) => {
            if (a.child_id && !assessmentMap.has(a.child_id)) assessmentMap.set(a.child_id, a);
        });

        // Map: Payment Aggregation — credit_used 포함
        const paymentMap = new Map<string, number>();
        let totalRevenue = 0;
        payments.forEach((p: any) => {
            const amount = (Number(p.amount) || 0) + (Number(p.credit_used) || 0);
            const current = paymentMap.get(p.child_id) || 0;
            paymentMap.set(p.child_id, current + amount);
            totalRevenue += amount;
        });

        // KPI Calculations
        const activeChildrenCount = children.filter((c: { status?: string | null; is_active?: boolean | null }) =>
            c.status === 'active' || (!c.status && c.is_active !== false)
        ).length;
        const newChildrenCount = children.filter((c: { created_at: string | null }) => c.created_at?.startsWith(selectedMonth)).length;

        const sessionStats = { completed: 0, cancelled: 0, scheduled: 0, total: 0 };
        schedules.forEach((s: { status: string | null }) => {
            sessionStats.total++;
            if (s.status === 'completed') sessionStats.completed++;
            else if (s.status === 'cancelled') sessionStats.cancelled++;
            else if (s.status === 'scheduled') sessionStats.scheduled++;
        });

        // ✨ [NEW] 채널별 유입 집계
        const channelCounts = new Map<string, number>();
        siteVisits.forEach((v: any) => {
            const cat = v.source_category || 'Others';
            channelCounts.set(cat, (channelCounts.get(cat) || 0) + 1);
        });

        // ------------------------------------------------------------------
        // 3. Build Sheet Data
        // ------------------------------------------------------------------
        const monthLabel = formatMonthKR(selectedMonth);

        // Sheet 1: Dashboard KPI — ✨ [FIX] 월 표시 추가, 마케팅 유입 포함
        const dashboardData = [
            { 'Category': '📅 기간', 'Metric': '보고서 기간', 'Value': monthLabel, 'Unit': '' },
            { 'Category': '', 'Metric': '', 'Value': '', 'Unit': '' },
            { 'Category': '💰 재무', 'Metric': '총 매출 (Revenue)', 'Value': totalRevenue, 'Unit': 'KRW' },
            { 'Category': '📈 성장', 'Metric': '활성 아동 수 (Active Members)', 'Value': activeChildrenCount, 'Unit': '명' },
            { 'Category': '📈 성장', 'Metric': '신규 등록 (New Members)', 'Value': newChildrenCount, 'Unit': '명' },
            { 'Category': '📋 운영', 'Metric': '총 수업 수 (Total Sessions)', 'Value': sessionStats.total, 'Unit': '건' },
            { 'Category': '📋 운영', 'Metric': '수업 완료 (Completed)', 'Value': sessionStats.completed, 'Unit': '건' },
            { 'Category': '📋 운영', 'Metric': '수업 취소 (Cancelled)', 'Value': sessionStats.cancelled, 'Unit': '건' },
            { 'Category': '📋 운영', 'Metric': '예약됨 (Scheduled)', 'Value': sessionStats.scheduled, 'Unit': '건' },
            { 'Category': '📋 운영', 'Metric': '출석률', 'Value': sessionStats.total > 0 ? `${Math.round(sessionStats.completed / sessionStats.total * 100)}%` : '-', 'Unit': '' },
        ];

        // Sheet 2: Marketing Intelligence — ✨ [FIX] 채널별 유입 상세 데이터 (site_visits)
        const marketingData: Record<string, string | number>[] = [];

        // 2-1. 채널 요약 (상단)
        marketingData.push({ '구분': '📊 채널 요약', '채널': '', '방문수': '', '비율': '', 'UTM Source': '', 'UTM Medium': '', 'UTM Campaign': '', '방문일': '' });
        const totalVisits = siteVisits.length;
        Array.from(channelCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .forEach(([channel, count]) => {
                marketingData.push({
                    '구분': '',
                    '채널': channel,
                    '방문수': count,
                    '비율': totalVisits > 0 ? `${Math.round(count / totalVisits * 100)}%` : '0%',
                    'UTM Source': '', 'UTM Medium': '', 'UTM Campaign': '', '방문일': ''
                });
            });
        marketingData.push({ '구분': '', '채널': '합계', '방문수': totalVisits, '비율': '100%', 'UTM Source': '', 'UTM Medium': '', 'UTM Campaign': '', '방문일': '' });

        // 2-2. 빈 행 구분
        marketingData.push({ '구분': '', '채널': '', '방문수': '', '비율': '', 'UTM Source': '', 'UTM Medium': '', 'UTM Campaign': '', '방문일': '' });

        // 2-3. 개별 방문 상세
        marketingData.push({ '구분': '📋 방문 상세', '채널': '', '방문수': '', '비율': '', 'UTM Source': '', 'UTM Medium': '', 'UTM Campaign': '', '방문일': '' });
        if (siteVisits.length > 0) {
            siteVisits.forEach((v: any) => {
                marketingData.push({
                    '구분': '',
                    '채널': v.source_category || 'Others',
                    '방문수': '',
                    '비율': '',
                    'UTM Source': v.utm_source || '-',
                    'UTM Medium': v.utm_medium || '-',
                    'UTM Campaign': v.utm_campaign || '-',
                    '방문일': formatDate(v.visited_at)
                });
            });
        } else {
            marketingData.push({ '구분': '', '채널': '(해당 월 유입 데이터 없음)', '방문수': '', '비율': '', 'UTM Source': '-', 'UTM Medium': '-', 'UTM Campaign': '-', '방문일': '-' });
        }

        // Sheet 3: Staff Information
        const staffData = staff.length > 0
            ? staff.map((s: { name: string | null; role: string; email: string; status: string | null; created_at: string | null }) => ({
                '이름': s.name || '-',
                '역할': s.role === 'admin' ? '원장/관리자' : s.role === 'therapist' ? '치료사' : s.role === 'super_admin' ? '슈퍼관리자' : s.role,
                '이메일': s.email,
                '상태': s.status || 'active',
                '입사일': formatDate(s.created_at)
            }))
            : [{ '이름': '(직원 정보 없음)', '역할': '-', '이메일': '-', '상태': '-', '입사일': '-' }];

        // Sheet 4: Payment Details
        const paymentDetailData = payments.length > 0
            ? payments.map((p: any) => {
                const childName = children.find((c: { id: string; name: string }) => c.id === p.child_id)?.name || 'Unknown';
                return {
                    '결제월': selectedMonth,
                    '결제일시': p.paid_at ? new Date(p.paid_at).toLocaleString() : '-',
                    '아동명': childName,
                    '결제금액': Number(p.amount) || 0,
                    '크레딧사용': Number(p.credit_used) || 0,
                    '합계': (Number(p.amount) || 0) + (Number(p.credit_used) || 0),
                    '결제수단': p.method || '-',
                    '메모': p.memo || '-'
                };
            })
            : [{ '결제월': selectedMonth, '결제일시': '(수납 내역 없음)', '아동명': '-', '결제금액': 0, '크레딧사용': 0, '합계': 0, '결제수단': '-', '메모': '-' }];

        // Sheet 5: Integrated Master — ✨ [FIX] 제목 행 + 보호자 정보 별도 조회
        const payColName = `${monthLabel} 결제액`;
        const masterData = children.length > 0
            ? children.map((child: { id: string; name: string; birth_date: string; gender: string | null; status?: string | null; is_active?: boolean | null; parent_id: string | null; created_at: string | null }) => {
                const guardian = child.parent_id ? profileMap.get(child.parent_id) : null;
                const assess = assessmentMap.get(child.id);
                const totalPay = paymentMap.get(child.id) || 0;
                const genderMap: Record<string, string> = { 'male': '남', 'female': '여', 'other': '-' };
                const statusLabel = child.status === 'active' ? '이용중' : child.status === 'waiting' ? '대기' : child.status === 'inactive' ? '종결' : (child.is_active ? '이용중' : '종결');

                return {
                    '아동명': child.name,
                    '생년월일': child.birth_date || '-',
                    '성별': genderMap[child.gender || ''] || child.gender || '-',
                    '상태': statusLabel,
                    '등록일': formatDate(child.created_at),
                    '보호자명': guardian?.name || '-',
                    '보호자 연락처': guardian?.phone || '-',
                    [payColName]: totalPay,
                    '언어(점)': assess?.score_communication || 0,
                    '사회(점)': assess?.score_social || 0,
                    '인지(점)': assess?.score_cognitive || 0,
                    '운동(점)': assess?.score_motor || 0,
                    '자조(점)': assess?.score_adaptive || 0,
                    '종합 소견': assess?.summary || '-',
                    '평가 상세': formatEvidenceDetailed(assess?.assessment_details),
                    '최근 평가일': formatDate(assess?.evaluation_date),
                };
            })
            : [{ '아동명': '(등록된 아동 없음)', '생년월일': '-', '성별': '-', '상태': '-', '등록일': '-', '보호자명': '-', '보호자 연락처': '-', [payColName]: 0, '언어(점)': 0, '사회(점)': 0, '인지(점)': 0, '운동(점)': 0, '자조(점)': 0, '종합 소견': '-', '평가 상세': '-', '최근 평가일': '-' }];

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

        addSheet(dashboardData, '1.월간 요약');
        addSheet(marketingData, '2.채널별 유입');
        addSheet(staffData, '3.직원 정보');
        addSheet(paymentDetailData, '4.수납 내역');
        addSheet(masterData, '5.아동 전체 현황');

        // Export
        const fileName = `Zarada_${monthLabel}_통합보고서_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`;
        XLSX.writeFile(wb, fileName);

        return { success: true, count: children.length };

    } catch (error: any) {
        console.error('Report Generation Error:', error);
        alert(`리포트 생성 실패: ${error.message}`);
        return { success: false, error: error.message };
    }
};

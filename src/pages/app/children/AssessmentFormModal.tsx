// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useCenter } from '@/contexts/CenterContext'; // ✨ Import
import { X, Save, Loader2, Brain, Activity, MessageCircle, Baby, HeartHandshake, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssessmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    childId: string;
    childName: string;
    logId?: string | null;
    scheduleId?: string | null;  // ✨ [추가] 대기 목록 삭제를 위해 필요
    sessionDate?: string | null; // ✨ [추가] 과거 날짜 보존을 위해 필요
    therapistId?: string | null;  // ✨ [담당 치료사 ID] 어드민이 대신 입력시 사용
    assessmentId?: string | null;  // ✨ [수정 모드용] 기존 평가 ID
    onSuccess: () => void;
}

// ✨ [Integrity] 5 Standard Domains x 5 Checklist Items = Scientific Scoring
const CHECKLIST_ITEMS = {
    communication: [
        { id: 'c1', label: '자신의 이름을 부르면 반응합니까?' },
        { id: 'c2', label: '두 단어 이상의 문장을 연결할 수 있습니까?' },
        { id: 'c3', label: '간단한 지시("앉아", "주세요")를 따릅니까?' },
        { id: 'c4', label: '사물의 이름을 물으면 대답합니까?' },
        { id: 'c5', label: '자신의 감정이나 필요를 말로 표현합니까?' }
    ],
    social: [
        { id: 's1', label: '눈을 맞추며 상호작용합니까?' },
        { id: 's2', label: '다른 아이들에게 관심을 보입니까?' },
        { id: 's3', label: '순서를 지키며 놀이를 할 수 있습니까?' },
        { id: 's4', label: '낯선 사람에게 적절한 반응을 보입니까?' },
        { id: 's5', label: '보호자와 분리될 때 안정을 유지합니까?' }
    ],
    cognitive: [
        { id: 'g1', label: '흥미 있는 물건을 쳐다보거나 손을 뻗습니까?' },
        { id: 'g2', label: '숨겨진 물건을 찾을 수 있습니까?' },
        { id: 'g3', label: '모양이나 색깔을 구별합니까?' },
        { id: 'g4', label: '간단한 퍼즐이나 블록을 맞춤니까?' },
        { id: 'g5', label: '숫자나 개념(크다/작다)을 이해합니까?' }
    ],
    motor: [
        { id: 'm1', label: '스스로 걸을 수 있습니까?' },
        { id: 'm2', label: '계단을 오르내릴 수 있습니까?' },
        { id: 'm3', label: '작은 물건을 엄지와 검지로 집을 수 있습니까?' },
        { id: 'm4', label: '색연필을 쥐고 선을 그릴 수 있습니까?' },
        { id: 'm5', label: '공을 던지거나 찰 수 있습니까?' }
    ],
    adaptive: [
        { id: 'a1', label: '스스로 숟가락/포크를 사용합니까?' },
        { id: 'a2', label: '컵으로 물을 마실 수 있습니까?' },
        { id: 'a3', label: '옷을 입거나 벗을 때 협조합니까?' },
        { id: 'a4', label: '대소변 의사를 표현합니까?' },
        { id: 'a5', label: '위험한 행동을 제지하면 멈춥니까?' }
    ]
};

export function AssessmentFormModal({
    isOpen, onClose, childId, childName, logId,
    scheduleId, sessionDate, therapistId, assessmentId, onSuccess
}: AssessmentFormModalProps) {
    const { center } = useCenter(); // ✨ Context
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // ✨ [Updated] State includes 'details' for JSONB storage
    const [sc, setSc] = useState<any>({
        communication: 0,
        social: 0,
        cognitive: 0,
        motor: 0,
        adaptive: 0
    });

    // Checklist State: { communication: ['c1', 'c2'], ... }
    const [details, setDetails] = useState<any>({
        communication: [],
        social: [],
        cognitive: [],
        motor: [],
        adaptive: []
    });

    const [summary, setSummary] = useState('');
    const [therapistNotes, setTherapistNotes] = useState('');  // ✨ [치료사 전용] 부모에게 비공개 메모
    const [currentLogId, setCurrentLogId] = useState<string | null>(null); // ✨ [Link] DB에 저장된 log_id 보존
    const [expandedDomain, setExpandedDomain] = useState<string | null>('communication');
    const [originalTherapistId, setOriginalTherapistId] = useState<string | null>(null); // ✨ [Fix] 수정시 원래 작성자 ID 보존

    // ✨ [수정 모드] 기존 데이터 로드
    useEffect(() => {
        if (isOpen && assessmentId) {
            loadExistingData();
        } else {
            // Reset form for new entry
            setSc({ communication: 0, social: 0, cognitive: 0, motor: 0, adaptive: 0 });
            setDetails({ communication: [], social: [], cognitive: [], motor: [], adaptive: [] });
            setSummary('');
            setTherapistNotes('');
            setCurrentLogId(logId || null);
            setExpandedDomain('communication');
            setOriginalTherapistId(null);
            setIsEditMode(false);
        }
    }, [isOpen, assessmentId, logId]);

    const loadExistingData = async () => {
        try {
            const { data, error } = await supabase
                .from('development_assessments')
                .select('*')
                .eq('id', assessmentId)
                .maybeSingle();

            if (error) throw error;
            if (data) {
                setSc({
                    communication: data.score_communication || 0,
                    social: data.score_social || 0,
                    cognitive: data.score_cognitive || 0,
                    motor: data.score_motor || 0,
                    adaptive: data.score_adaptive || 0
                });
                setDetails(data.assessment_details || { communication: [], social: [], cognitive: [], motor: [], adaptive: [] });
                setSummary(data.summary || '');
                setTherapistNotes(data.therapist_notes || '');
                setCurrentLogId(data.log_id || null);
                setOriginalTherapistId(data.therapist_id || null); // ✨ 원래 작성자 ID 저장
                setIsEditMode(true);
            }
        } catch (e) {
            console.error('기존 데이터 로드 오류:', e);
        }
    };

    if (!isOpen || !childId) return null;

    // ✨ [Logic] Toggle checklist item & Auto-calculate score
    const toggleCheck = (domain: string, itemId: string) => {
        setDetails(prev => {
            const currentList = prev[domain] || [];
            const isChecked = currentList.includes(itemId);
            const newList = isChecked
                ? currentList.filter(id => id !== itemId)
                : [...currentList, itemId];

            // Auto-update score safely
            const newScore = Math.min(5, Math.max(1, newList.length)); // 1 ~ 5 scale based on count

            // Side-effect: Update score state
            setSc(prevSc => ({ ...prevSc, [domain]: newScore === 0 ? 1 : newScore })); // Minimum 1

            return { ...prev, [domain]: newList };
        });
    };

    // Manual Slider Change (Optional override)
    const handleSliderChange = (domain: string, val: number) => {
        setSc(prev => ({ ...prev, [domain]: val }));
    }

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('로그인이 필요합니다.');

            // ✨ [FIX] therapist ID 결정 로직 개선
            // 1. 수정 모드인 경우: 원래 작성자(originalTherapistId) 유지 시도
            // 2. 신규 작성 OR 어드민 대리 작성 시: props로 전달받은 therapistId 사용
            // 3. 본인 작성 시: therapists 테이블에서 profile_id로 조회하여 ID 가져오기
            let effectiveTherapistId = (isEditMode && originalTherapistId) ? originalTherapistId : therapistId;

            if (!effectiveTherapistId) {
                const { data: myTherapist } = await supabase
                    .from('therapists')
                    .select('id')
                    .eq('profile_id', user.id)  // ✨ profile_id = auth.users.id
                    .maybeSingle();
                effectiveTherapistId = myTherapist?.id || null;
            }

            // ⚠️ 절대 user.id(Auth ID)를 직접 넣으면 안 됨 (FK 제약 조건 위반)
            if (!effectiveTherapistId) {
                console.warn('Therapist ID not resolved. Checking if caller is admin...');
                throw new Error('작성자(치료사) 정보를 확인할 수 없습니다. 치료사 목록에 해당 계정이 등록되어 있는지 확인해주세요.');
            }

            const payload: any = { // Changed to 'any' to allow modification of log_id
                center_id: center?.id, // ✨ Inject Center ID
                child_id: childId,
                therapist_id: effectiveTherapistId, // ✨ therapists 테이블의 ID 사용
                log_id: currentLogId,
                evaluation_date: new Date().toISOString().split('T')[0],
                score_communication: sc.communication,
                score_social: sc.social,
                score_cognitive: sc.cognitive,
                score_motor: sc.motor,
                score_adaptive: sc.adaptive,
                summary: summary,
                therapist_notes: therapistNotes,
                assessment_details: details
            };

            let activeLogId = currentLogId;

            // ✨ [핵심 수정] 일지가 없는 경우 저장을 누르는 시점에 자동 생성 (유령 일지 방지)
            if (!isEditMode && !activeLogId) {
                if (!center?.id) throw new Error('센터 정보가 없어 상담 일지를 생성할 수 없습니다.');

                const finalDate = sessionDate || new Date().toISOString().split('T')[0];
                console.log(`Creating log for schedule: ${scheduleId} on date: ${finalDate}`);

                const { data: newLog, error: logError } = await supabase
                    .from('counseling_logs')
                    .insert({
                        center_id: center?.id,
                        therapist_id: effectiveTherapistId,
                        child_id: childId,
                        schedule_id: scheduleId, // ✨ [Fix] 스케줄 연결 로직 복구
                        session_date: finalDate, // ✨ [Fix] 날짜 보존 로직 추가
                        content: '발달 평가 작성을 위해 자동 생성된 기본 일지입니다.',
                        activities: '평가 진행',
                        child_response: '평가 진행',
                        next_plan: '평가 결과 기반 계획 수립'
                    })
                    .select()
                    .single();

                if (logError) throw new Error('상담 일지 자동 생성 실패: ' + logError.message);
                activeLogId = newLog.id;
                payload.log_id = activeLogId; // 페이로드 업데이트
            }

            let error;
            if (isEditMode && assessmentId) {
                // ✨ [수정 모드]
                const res = await supabase.from('development_assessments').update(payload).eq('id', assessmentId);
                error = res.error;
            } else {
                // [신규 등록]
                const res = await supabase.from('development_assessments').insert(payload);
                error = res.error;
            }

            if (error) throw error;

            alert(isEditMode ? '발달 평가가 수정되었습니다.' : '발달 평가가 저장되었습니다.');
            onSuccess();
            onClose();
        } catch (e: any) {
            console.error(e);
            alert('저장 실패: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const DOMAINS = [
        { key: 'communication', label: '언어/의사소통', desc: '표현, 수용, 발음, 어휘력', icon: MessageCircle, color: 'text-blue-500 bg-blue-50' },
        { key: 'social', label: '사회/정서', desc: '또래 관계, 감정 조절, 규칙 준수', icon: HeartHandshake, color: 'text-rose-500 bg-rose-50' },
        { key: 'cognitive', label: '인지/학습', desc: '문제 해결, 기억력, 집중력', icon: Brain, color: 'text-purple-500 bg-purple-50' },
        { key: 'motor', label: '대근육/소근육', desc: '신체 조절, 그리기/쓰기, 조작', icon: Activity, color: 'text-amber-500 bg-amber-50' },
        { key: 'adaptive', label: '자조/적응', desc: '식사, 착탈의, 일상 생활 수행', icon: Baby, color: 'text-emerald-500 bg-emerald-50' },
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">발달 평가 작성</h2>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">{childName} 아동 • 영역별 체크리스트 기반 평가</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                    {/* Scores & Checklists */}
                    <div className="space-y-6">
                        {DOMAINS.map((domain) => {
                            const isExpanded = expandedDomain === domain.key;
                            return (
                                <div key={domain.key} className={cn("bg-white rounded-3xl border transition-all duration-300 overflow-hidden", isExpanded ? "border-indigo-200 shadow-md" : "border-slate-100 hover:border-indigo-100")}>
                                    {/* Summary Row */}
                                    <div
                                        className="p-5 flex items-center gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                                        onClick={() => setExpandedDomain(isExpanded ? null : domain.key)}
                                    >
                                        <div className={cn("p-3 rounded-xl", domain.color)}>
                                            <domain.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-800">{domain.label}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${(sc[domain.key] || 0) * 20}%` }} />
                                                </div>
                                                <span className="text-xs font-black text-indigo-600">{sc[domain.key]}점</span>
                                            </div>
                                        </div>
                                        <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                            {isExpanded ? '접기' : '평가하기'}
                                        </div>
                                    </div>

                                    {/* Expanded Detail Section */}
                                    {isExpanded && (
                                        <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2">
                                            <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-3">
                                                <p className="text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">평가 체크리스트 (자동 점수 계산)</p>
                                                {CHECKLIST_ITEMS[domain.key].map((item: any) => {
                                                    const isChecked = details[domain.key].includes(item.id);
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => toggleCheck(domain.key, item.id)}
                                                            className={cn(
                                                                "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border",
                                                                isChecked ? "bg-white dark:bg-slate-700 border-indigo-200 dark:border-indigo-500/50 shadow-sm" : "bg-transparent border-transparent hover:bg-white dark:hover:bg-slate-700 hover:border-slate-100 dark:hover:border-slate-600"
                                                            )}
                                                        >
                                                            <div className={cn("w-5 h-5 rounded-md flex items-center justify-center transition-colors", isChecked ? "bg-indigo-500 text-white" : "bg-slate-200 dark:bg-slate-600 text-slate-400")}>
                                                                {isChecked ? <CheckSquare className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5" />}
                                                            </div>
                                                            <span className={cn("text-sm font-bold transition-colors", isChecked ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400")}>{item.label}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Manual Adjustment */}
                                            <div className="mt-4 px-2">
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500">점수 수동 보정 (필요시)</label>
                                                    <span className="text-sm font-black text-slate-900 dark:text-white">{sc[domain.key]} / 5</span>
                                                </div>
                                                <input
                                                    type="range" min="1" max="5" step="1"
                                                    value={sc[domain.key]}
                                                    onChange={(e) => handleSliderChange(domain.key, Number(e.target.value))}
                                                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Summary */}
                    <div className="space-y-2">
                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 ml-1">종합 소견 (부모 공개)</label>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="이번 달 발달 변화나 특이사항을 자유롭게 작성해주세요... (평가 근거 요약 포함)"
                            className="w-full h-32 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-50/50 dark:focus:ring-indigo-500/20 focus:border-indigo-200 dark:focus:border-indigo-500 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                    </div>

                    {/* ✨ [치료사 전용] 비공개 메모 - 부모에게 안보임 */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 ml-1">
                            <label className="text-sm font-black text-rose-600 dark:text-rose-400">치료사 메모 (비공개)</label>
                            <span className="text-[10px] bg-rose-100 dark:bg-rose-900/50 text-rose-500 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold">부모 앱 미노출</span>
                        </div>
                        <textarea
                            value={therapistNotes}
                            onChange={(e) => setTherapistNotes(e.target.value)}
                            placeholder="부모에게 공개되지 않는 내부 기록입니다. (행동 패턴, 주의사항, 다음 치료사에게 전달 사항 등)"
                            className="w-full h-24 p-4 rounded-2xl border-2 border-rose-100 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-900/20 font-medium text-sm focus:outline-none focus:ring-4 focus:ring-rose-50 dark:focus:ring-rose-500/20 focus:border-rose-200 dark:focus:border-rose-500 resize-none text-rose-900 dark:text-rose-100 placeholder:text-rose-300 dark:placeholder:text-rose-400/50"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-3 rounded-2xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        평가 저장하기
                    </button>
                </div>
            </div>
        </div>
    );
}

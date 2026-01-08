// @ts-nocheck
/* eslint-disable */
import { Progress } from "@/components/ui/progress"; // shadcn/ui 사용 가정
import { Baby, MessageCircle, Brain, Activity } from "lucide-react";

interface DevScoreProps {
    label: string;
    score: number;
    icon: React.ReactNode;
    color: string;
}

function DevelopmentBar({ label, score, icon, color }: DevScoreProps) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-lg", color.replace('bg-', 'bg-opacity-20 '))}>
                        {icon}
                    </div>
                    <span className="text-sm font-black text-slate-700">{label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-900">{score}</span>
                    <span className="text-xs font-bold text-slate-400">/ 100</span>
                </div>
            </div>
            {/* 가로형 막대 그래프: 숫자가 잘 보이도록 설계 */}
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all duration-1000", color)}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );
}

export function ParentDevelopmentChart({ scores, lastDate }: { scores: any, lastDate: string }) {
    if (!scores) return (
        <div className="bg-white p-8 rounded-[32px] border-2 border-dashed border-slate-100 text-center">
            <p className="text-slate-400 font-bold">아직 기록된 발달 지표가 없습니다.</p>
        </div>
    );

    return (
        <section className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-50 space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-black text-slate-900">영역별 발달 상태</h3>
                    <p className="text-xs text-slate-400 mt-1 font-bold">최근 업데이트: {lastDate}</p>
                </div>
                <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black">
                    정상 발달 범위
                </div>
            </div>

            <div className="space-y-6">
                <DevelopmentBar
                    label="언어 발달"
                    score={scores.score_language}
                    icon={<MessageCircle className="w-4 h-4 text-blue-600" />}
                    color="bg-blue-500"
                />
                <DevelopmentBar
                    label="사회성"
                    score={scores.score_social}
                    icon={<Baby className="w-4 h-4 text-rose-600" />}
                    color="bg-rose-500"
                />
                <DevelopmentBar
                    label="인지 능력"
                    score={scores.score_cognition}
                    icon={<Brain className="w-4 h-4 text-purple-600" />}
                    color="bg-purple-500"
                />
                <DevelopmentBar
                    label="대/소근육"
                    score={scores.score_motor}
                    icon={<Activity className="w-4 h-4 text-amber-600" />}
                    color="bg-amber-500"
                />
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                * 본 지표는 담당 치료사의 전문적인 소견과 상담 내용을 바탕으로 수치화되었습니다. 상세 내용은 상담 일지를 확인해 주세요.
            </p>
        </section>
    );
}
// ParentHomePage.tsx 내부 로직 예시
const [devData, setDevData] = useState<any>(null);

const loadDevData = async () => {
    const { data } = await supabase
        .from('consultations')
        .select('score_language, score_social, score_cognition, score_motor, created_at')
        .eq('child_id', childId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (data) setDevData(data);
};

// 렌더링 부분
<ParentDevelopmentChart
    scores={devData}
    lastDate={devData?.created_at?.split('T')[0]}
/>
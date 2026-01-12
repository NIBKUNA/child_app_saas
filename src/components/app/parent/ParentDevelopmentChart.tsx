// @ts-nocheck
/* eslint-disable */
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { Brain, Activity, MessageCircle, Baby, HeartHandshake, CheckCircle2, Circle } from "lucide-react";
import { cn } from '@/lib/utils';
import { useState } from 'react';

// ✨ [Integrity] Same checklist items as AssessmentFormModal for consistency
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

const DOMAINS_META = [
    { key: 'communication', label: '언어/의사소통', color: 'text-blue-600', bg: 'bg-blue-50', icon: MessageCircle },
    { key: 'social', label: '사회/정서', color: 'text-rose-600', bg: 'bg-rose-50', icon: HeartHandshake },
    { key: 'cognitive', label: '인지/학습', color: 'text-purple-600', bg: 'bg-purple-50', icon: Brain },
    { key: 'motor', label: '대근육/소근육', color: 'text-amber-600', bg: 'bg-amber-50', icon: Activity },
    { key: 'adaptive', label: '자조/적응', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Baby },
];

export function ParentDevelopmentChart({ assessments }: { assessments: any[] }) {
    const [selectedTab, setSelectedTab] = useState<'chart' | 'detail'>('chart');

    if (!assessments || assessments.length === 0) return (
        <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-black">아직 기록된 발달 평가가 없습니다.</p>
            <p className="text-xs text-slate-300 mt-2">치료사가 정기 평가를 작성하면 이곳에 그래프가 표시됩니다.</p>
        </div>
    );

    // 1. 최신 데이터 (Radar Chart용)
    const latest = assessments[0];
    const previous = assessments.length > 1 ? assessments[1] : null;  // ✨ 이전 평가
    const radarData = [
        { subject: '언어/의사소통', A: latest.score_communication || 0, B: previous?.score_communication || 0, fullMark: 5 },
        { subject: '사회/정서', A: latest.score_social || 0, B: previous?.score_social || 0, fullMark: 5 },
        { subject: '인지/학습', A: latest.score_cognitive || 0, B: previous?.score_cognitive || 0, fullMark: 5 },
        { subject: '대/소근육', A: latest.score_motor || 0, B: previous?.score_motor || 0, fullMark: 5 },
        { subject: '자조/적응', A: latest.score_adaptive || 0, B: previous?.score_adaptive || 0, fullMark: 5 },
    ];

    // 2. 이력 데이터 (Line Chart용 - 최근 6개월 역순 정렬)
    const historyData = [...assessments].reverse().map(a => ({
        date: a.evaluation_date?.slice(5, 7) + '월', // "01월"
        '언어': a.score_communication,
        '사회': a.score_social,
        '인지': a.score_cognitive,
        '운동': a.score_motor,
        '자조': a.score_adaptive,
    }));

    // Safe JSON Parse
    let details = {};
    if (typeof latest.assessment_details === 'string') {
        try { details = JSON.parse(latest.assessment_details); } catch (e) { }
    } else {
        details = latest.assessment_details || {};
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Tab Navigation */}
            <div className="flex gap-2 p-1 bg-slate-100/80 rounded-2xl w-fit">
                <button
                    onClick={() => setSelectedTab('chart')}
                    className={cn(
                        "px-4 py-2 rounded-xl text-sm font-black transition-all",
                        selectedTab === 'chart' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    종합 그래프
                </button>
                <button
                    onClick={() => setSelectedTab('detail')}
                    className={cn(
                        "px-4 py-2 rounded-xl text-sm font-black transition-all",
                        selectedTab === 'detail' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    상세 평가 근거
                </button>
            </div>

            {selectedTab === 'chart' && (
                <>
                    {/* 1. 최신 발달 밸런스 (Radar Chart) */}
                    <section className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-50 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">영역별 발달 밸런스</h3>
                                <p className="text-xs text-slate-400 mt-1 font-bold">최근 평가: {latest.evaluation_date}</p>
                            </div>
                            {previous && (
                                <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
                                    회색 = 이전 평가
                                </div>
                            )}
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                                    <Radar
                                        name="현재 발달"
                                        dataKey="A"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fill="#8b5cf6"
                                        fillOpacity={0.4}
                                    />
                                    {/* ✨ 성장 비교 모드: 이전 평가 오버레이 */}
                                    {previous && (
                                        <Radar
                                            name="이전 평가"
                                            dataKey="B"
                                            stroke="#94a3b8"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            fill="#cbd5e1"
                                            fillOpacity={0.15}
                                        />
                                    )}
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend Chips */}
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                            {DOMAINS_META.map(d => (
                                <div key={d.key} className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full", d.bg)}>
                                    <d.icon className={cn("w-3 h-3 icon-class", d.color)} />
                                    <span className={cn("text-[10px] font-bold", d.color)}>
                                        {latest[`score_${d.key}`] || 0}/5
                                    </span>
                                </div>
                            ))}
                        </div>


                    </section>

                    {/* 2. 성장 추이 (Line Chart) */}
                    {historyData.length > 1 && (
                        <section className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-50">
                            <h3 className="text-lg font-black text-slate-900 mb-6">최근 성장 추이</h3>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                                        <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                        />
                                        <Line type="monotone" dataKey="언어" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                                        <Line type="monotone" dataKey="사회" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
                                        <Line type="monotone" dataKey="인지" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </section>
                    )}
                </>
            )}

            {selectedTab === 'detail' && (
                <section className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-50 space-y-8 animate-in slide-in-from-right-4">
                    <div className="mb-6">
                        <h3 className="text-lg font-black text-slate-900">상세 평가 근거</h3>
                        <p className="text-xs text-slate-400 mt-1 font-bold">점수 산출 기준이 되는 세부 항목입니다.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {DOMAINS_META.map(domain => {
                            const currentScore = latest[`score_${domain.key}`] || 0;
                            const checkedItems = details[domain.key] || [];

                            return (
                                <div key={domain.key} className="border border-slate-100 rounded-3xl p-5 hover:border-indigo-100 transition-colors">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={cn("p-2.5 rounded-xl", domain.bg)}>
                                            <domain.icon className={cn("w-5 h-5", domain.color)} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{domain.label}</h4>
                                            <span className={cn("text-xs font-black", domain.color)}>{currentScore} / 5 점</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        {CHECKLIST_ITEMS[domain.key]?.map((item: any) => {
                                            const isChecked = checkedItems.includes(item.id);
                                            return (
                                                <div key={item.id} className="flex items-start gap-2.5">
                                                    <div className={cn("mt-0.5", isChecked ? "text-emerald-500" : "text-slate-200")}>
                                                        {isChecked ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                                    </div>
                                                    <span className={cn("text-xs font-medium leading-relaxed", isChecked ? "text-slate-600" : "text-slate-300 line-through decoration-slate-200")}>
                                                        {item.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                        {(!CHECKLIST_ITEMS[domain.key] || CHECKLIST_ITEMS[domain.key].length === 0) && (
                                            <p className="text-xs text-slate-300">세부 평가 항목 없음</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}
// @ts-nocheck
/* eslint-disable */
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
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

export function ParentDevelopmentChart({
    assessments,
    isInteractive = false,
    onToggleCheck,
    parentChecks
}: {
    assessments: any[],
    isInteractive?: boolean,
    onToggleCheck?: (domain: string, itemId: string) => void,
    parentChecks?: Record<string, string[]>
}) {
    const [selectedTab, setSelectedTab] = useState<'chart' | 'detail'>('chart');

    const hasData = assessments && assessments.length > 0;

    if (!hasData && !isInteractive) return (
        <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-black">아직 기록된 발달 평가가 없습니다.</p>
            <p className="text-xs text-slate-300 mt-2">치료사가 정기 평가를 작성하면 이곳에 그래프가 표시됩니다.</p>
        </div>
    );

    const latest = assessments[0] || {
        evaluation_date: '진단 기록 없음',
        score_communication: 0, score_social: 0, score_cognitive: 0, score_motor: 0, score_adaptive: 0,
        assessment_details: {}
    };

    const previous = assessments.length > 1 ? assessments[1] : null;

    const radarData = [
        { subject: '언어/의사소통', A: latest.score_communication || 0, B: previous?.score_communication || 0, fullMark: 5 },
        { subject: '사회/정서', A: latest.score_social || 0, B: previous?.score_social || 0, fullMark: 5 },
        { subject: '인지/학습', A: latest.score_cognitive || 0, B: previous?.score_cognitive || 0, fullMark: 5 },
        { subject: '대/소근육', A: latest.score_motor || 0, B: previous?.score_motor || 0, fullMark: 5 },
        { subject: '자조/적응', A: latest.score_adaptive || 0, B: previous?.score_adaptive || 0, fullMark: 5 },
    ];

    const historyData = assessments
        .filter(a => a.evaluation_date !== '실시간 자가진단')
        .reverse()
        .map(a => ({
            date: a.evaluation_date?.includes('-') ? a.evaluation_date.slice(5, 7) + '월' : a.evaluation_date,
            '언어': a.score_communication,
            '사회': a.score_social,
            '인지': a.score_cognitive,
            '운동': a.score_motor,
            '자조': a.score_adaptive,
        }));

    let details = {};
    if (isInteractive && parentChecks) {
        details = parentChecks;
    } else {
        if (typeof latest.assessment_details === 'string') {
            try { details = JSON.parse(latest.assessment_details); } catch (e) { }
        } else {
            details = latest.assessment_details || {};
        }
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
                    <section className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-50 relative overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 leading-none">영역별 발달 밸런스</h3>
                                <p className="text-xs text-indigo-600 mt-2 font-black">
                                    {isInteractive ? '✨ 부모 자가진단 결과가 반영된 그래프입니다.' : `최근 기록일: ${latest.evaluation_date}`}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                    <span className="text-[10px] font-bold text-slate-600">현재 체크</span>
                                </div>
                                {previous && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-slate-200 border border-dashed border-slate-400"></div>
                                        <span className="text-[10px] font-bold text-slate-400">
                                            이전: {previous.summary?.includes('부모') ? '부모 자가진단' : '치료사 평가'} ({previous.evaluation_date?.slice(5)})
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="h-[300px] md:h-[340px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                                    <Radar
                                        name="현재 발달"
                                        dataKey="A"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fill="#8b5cf6"
                                        fillOpacity={0.4}
                                    />
                                    {previous && (
                                        <Radar
                                            name="이전 기록"
                                            dataKey="B"
                                            stroke="#94a3b8"
                                            strokeWidth={1.5}
                                            strokeDasharray="4 4"
                                            fill="#cbd5e1"
                                            fillOpacity={0.1}
                                        />
                                    )}
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                            {DOMAINS_META.map(d => (
                                <div key={d.key} className={cn("flex flex-col items-center gap-1 p-2.5 rounded-2xl border border-transparent transition-all", d.bg, selectedTab === 'detail' && "ring-2 ring-indigo-200")}>
                                    <d.icon className={cn("w-3.5 h-3.5", d.color)} />
                                    <span className={cn("text-xs font-black", d.color)}>
                                        {latest[`score_${d.key}`] || 0}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">{d.label}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 2. 성장 추이 (Line Chart) */}
                    {historyData.length > 0 && (
                        <section className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-50">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">우리 아이 성장 변화</h3>
                                    <p className="text-xs text-slate-400 mt-1 font-bold">누적된 체크 결과를 통해 발달 추이를 확인하세요.</p>
                                </div>
                            </div>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                                            dy={10}
                                        />
                                        <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                            itemStyle={{ fontSize: '11px', fontWeight: 'black', padding: '2px 0' }}
                                            labelStyle={{ fontSize: '12px', fontWeight: 'black', marginBottom: '8px', color: '#1e293b' }}
                                        />
                                        <Line type="monotone" dataKey="언어" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="사회" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="인지" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="운동" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="적응" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6">
                                {DOMAINS_META.map(d => (
                                    <div key={d.key} className="flex items-center gap-1.5">
                                        <div className={cn("w-2 h-2 rounded-full", d.color.replace('text-', 'bg-'))} />
                                        <span className="text-[10px] font-bold text-slate-500">{d.label}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}

            {selectedTab === 'detail' && (
                <div className="space-y-6">
                    <section className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-50 space-y-8 animate-in slide-in-from-right-4">
                        <div className="mb-6">
                            <h3 className="text-lg font-black text-slate-900">상세 평가 근거</h3>
                            <p className="text-sm text-indigo-600 mt-1 font-black">
                                {isInteractive ? '👉 각 항목을 터치하여 아이의 현재 상태를 체크해 보세요.' : '점수 산출 기준이 되는 세부 항목입니다.'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {DOMAINS_META.map(domain => {
                                const currentScore = latest[`score_${domain.key}`] || 0;
                                const checkedItems = details[domain.key] || [];

                                return (
                                    <div key={domain.key} className="border border-slate-100 rounded-[32px] p-6 hover:border-indigo-100 transition-colors bg-slate-50/30">
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className={cn("p-3 rounded-2xl", domain.bg)}>
                                                <domain.icon className={cn("w-5 h-5", domain.color)} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 tracking-tight">{domain.label}</h4>
                                                <span className={cn("text-xs font-black px-2 py-0.5 rounded-full bg-white border", domain.color)}>{currentScore} / 5 점</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {CHECKLIST_ITEMS[domain.key]?.map((item: any) => {
                                                const isChecked = checkedItems.includes(item.id);
                                                return (
                                                    <button
                                                        key={item.id}
                                                        disabled={!isInteractive}
                                                        onClick={() => isInteractive && onToggleCheck?.(domain.key, item.id)}
                                                        className={cn(
                                                            "w-full flex items-start gap-3 p-3 rounded-2xl transition-all text-left group",
                                                            isInteractive && "hover:bg-white hover:shadow-sm active:scale-[0.98]",
                                                            isChecked ? "text-slate-800" : "text-slate-400"
                                                        )}
                                                    >
                                                        <div className={cn("mt-0.5 shrink-0 transition-colors", isChecked ? "text-emerald-500" : "text-slate-200 group-hover:text-slate-300")}>
                                                            {isChecked ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                                        </div>
                                                        <span className={cn("text-xs font-bold leading-relaxed", !isChecked && "opacity-70")}>
                                                            {item.label}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* ✨ Scientific Grounds & Disclaimer */}
                    <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-8 space-y-4">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Brain className="w-5 h-5" />
                            <h4 className="text-sm font-black italic">Scientific Basis & Research Summary</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            본 자가진단 체크리스트는 <strong>K-DST(한국 영유아 발달선별검사)</strong> 및 <strong>K-ASQ(Korean Ages & Stages Questionnaires)</strong>의 핵심 문항을 통합적으로 재구성하였습니다.
                            언어, 사회성, 인지, 운동 등 각 영역의 지표는 보건복지부 발달 표준 및 WHO 아동 성장 기준을 근거로 설계되었습니다.
                        </p>
                        <div className="h-px bg-slate-200 w-12"></div>
                        <p className="text-[11px] text-rose-400 font-extrabold leading-relaxed">
                            ⚠️ [공지] 본 결과는 학술적 근거에 기반한 자가 체크 도구이며 의학적 진단을 대체할 수 없습니다.
                            아이의 발달 상태에 대한 최종 판단은 반드시 전문의 또는 센터의 자격을 갖춘 전문가와 상담하시기 바랍니다. 결과 값은 가정 내 양육 지도를 위한 참고용으로만 확인해 주세요.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
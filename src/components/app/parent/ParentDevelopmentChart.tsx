/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-10
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 */
import { useState } from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { Brain, Activity, MessageCircle, Baby, HeartHandshake, CheckCircle2, Circle } from "lucide-react";
import { cn } from '@/lib/utils';

// ✨ Checklist Items (Restored)
const CHECKLIST_ITEMS = {
    communication: [
        { id: 'c1', text: '부모나 친숙한 사람의 목소리에 반응하여 쳐다본다.' },
        { id: 'c2', text: '자신의 이름을 부르면 반응한다.' },
        { id: 'c3', text: '간단한 지시(예: "이리 와")를 따를 수 있다.' },
        { id: 'c4', text: '원하는 것을 손가락으로 가리킬 수 있다.' },
        { id: 'c5', text: '2~3단어로 된 문장을 말할 수 있다.' }
    ],
    social: [
        { id: 's1', text: '눈을 맞추며 웃거나 표정을 짓는다.' },
        { id: 's2', text: '친숙한 사람과 분리될 때 불안해하거나 운다.' },
        { id: 's3', text: '또래 아이들과 함께 있는 것을 좋아한다.' },
        { id: 's4', text: '간단한 놀이 규칙을 이해하고 지킨다.' },
        { id: 's5', text: '다른 사람의 감정(기쁨, 슬픔 등)에 반응한다.' }
    ],
    cognitive: [
        { id: 'g1', text: '숨겨진 물건을 찾으려 한다.' },
        { id: 'g2', text: '간단한 도형(동그라미, 세모)을 구별한다.' },
        { id: 'g3', text: '같은 색깔이나 모양끼리 분류할 수 있다.' },
        { id: 'g4', text: '1부터 10까지 셀 수 있다.' },
        { id: 'g5', text: '자신의 나이와 성별을 안다.' }
    ],
    motor: [
        { id: 'm1', text: '혼자서 걷거나 뛸 수 있다.' },
        { id: 'm2', text: '계단을 기어오르거나 걸어서 오르내린다.' },
        { id: 'm3', text: '작은 물건을 엄지와 집게손가락으로 집는다.' },
        { id: 'm4', text: '블록을 3개 이상 쌓을 수 있다.' },
        { id: 'm5', text: '연필을 잡고 선이나 동그라미를 그린다.' }
    ],
    adaptive: [
        { id: 'a1', text: '가리는 음식 없이 골고루 먹는다.' },
        { id: 'a2', text: '숟가락이나 포크를 사용하여 밥을 먹는다.' },
        { id: 'a3', text: '혼자서 옷을 벗거나 입으려 한다.' },
        { id: 'a4', text: '화장실 의사를 표현하고 배변 훈련을 하려 한다.' },
        { id: 'a5', text: '손을 씻고 수건으로 닦을 수 있다.' }
    ]
};

const DOMAINS_META = [
    { key: 'communication', label: '언어/의사소통', color: 'text-blue-600', bg: 'bg-blue-50', icon: MessageCircle },
    { key: 'social', label: '사회/정서', color: 'text-rose-600', bg: 'bg-rose-50', icon: HeartHandshake },
    { key: 'cognitive', label: '인지/학습', color: 'text-purple-600', bg: 'bg-purple-50', icon: Brain },
    { key: 'motor', label: '대근육/소근육', color: 'text-amber-600', bg: 'bg-amber-50', icon: Activity },
    { key: 'adaptive', label: '자조/적응', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Baby },
];

interface Assessment {
    evaluation_date: string;
    score_communication: number | null;
    score_social: number | null;
    score_cognitive: number | null;
    score_motor: number | null;
    score_adaptive: number | null;
    summary?: string | null;
    assessment_details?: Record<string, unknown> | null;
}

const getScore = (a: Assessment, domain: string): number | null => {
    switch (domain) {
        case 'communication': return a.score_communication;
        case 'social': return a.score_social;
        case 'cognitive': return a.score_cognitive;
        case 'motor': return a.score_motor;
        case 'adaptive': return a.score_adaptive;
        default: return null;
    }
};

export function ParentDevelopmentChart({
    assessments,
    isInteractive = false,
    onToggleCheck,
    parentChecks
}: {
    assessments: Assessment[],
    isInteractive?: boolean,
    onToggleCheck?: (domain: string, itemId: string) => void,
    parentChecks?: Record<string, string[]>
}) {
    const [viewMode, setViewMode] = useState<'chart' | 'detail'>('chart');
    const [selectedTab, setSelectedTab] = useState('communication');

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
        } as Record<string, any>));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-2xl w-fit mx-auto">
                <button
                    onClick={() => setViewMode('chart')}
                    className={cn(
                        "px-6 py-2 rounded-xl text-xs font-black transition-all",
                        viewMode === 'chart' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    종합 그래프
                </button>
                <button
                    onClick={() => setViewMode('detail')}
                    className={cn(
                        "px-6 py-2 rounded-xl text-xs font-black transition-all",
                        viewMode === 'detail' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    상세 평가 근거
                </button>
            </div>

            {viewMode === 'chart' ? (
                <>
                    {/* 1. 최신 발달 밸런스 (Radar Chart) */}
                    <section className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-50 relative overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 leading-none">영역별 발달 밸런스</h3>
                                <p className="text-xs text-indigo-600 mt-2 font-black">
                                    {latest.evaluation_date === '실시간 자가진단' ? '✨ 부모 자가진단 결과가 반영된 그래프입니다.' : `최근 기록일: ${latest.evaluation_date}`}
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
                                            이전: {previous.summary === '부모님 자가진단 기록' ? '부모 자가진단' : '치료사 평가'} ({previous.evaluation_date?.slice(5)})
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
                                    <Radar
                                        name="현재 발달"
                                        dataKey="A"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fill="#8b5cf6"
                                        fillOpacity={0.4}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                            {DOMAINS_META.map(d => (
                                <div key={d.key} className={cn("flex flex-col items-center gap-1 p-2.5 rounded-2xl border border-transparent transition-all", d.bg)}>
                                    <d.icon className={cn("w-3.5 h-3.5", d.color)} />
                                    <span className={cn("text-xs font-black", d.color)}>
                                        {getScore(latest, d.key) || 0}
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
                        </section>
                    )}
                </>
            ) : (
                <section className="bg-white rounded-[40px] shadow-sm border border-slate-50 overflow-hidden">
                    <div className="flex overflow-x-auto p-4 gap-2 border-b border-slate-100 no-scrollbar">
                        {DOMAINS_META.map(d => (
                            <button
                                key={d.key}
                                onClick={() => setSelectedTab(d.key)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all",
                                    selectedTab === d.key ? d.bg + " ring-2 ring-inset ring-black/5" : "hover:bg-slate-50"
                                )}
                            >
                                <span className={cn("text-xs font-black", d.color)}>{d.label}</span>
                                {isInteractive && parentChecks && parentChecks[d.key] && (
                                    <span className="bg-white px-1.5 rounded-md text-[10px] font-bold shadow-sm text-slate-900">
                                        {parentChecks[d.key].length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 md:p-8 space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-black text-slate-800">
                                {DOMAINS_META.find(d => d.key === selectedTab)?.label} 체크리스트
                            </h4>
                            {isInteractive && <span className="text-xs font-bold text-slate-400">터치하여 상태 변경</span>}
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {CHECKLIST_ITEMS[selectedTab as keyof typeof CHECKLIST_ITEMS]?.map((item) => {
                                const isChecked = isInteractive && parentChecks && parentChecks[selectedTab]?.includes(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => isInteractive && onToggleCheck && onToggleCheck(selectedTab, item.id)}
                                        className={cn(
                                            "flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden",
                                            isInteractive ? "cursor-pointer active:scale-[0.98]" : "opacity-80",
                                            isChecked
                                                ? "bg-indigo-50 border-indigo-200"
                                                : "bg-white border-slate-100 hover:border-indigo-100"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                                            isChecked ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-300 bg-slate-50"
                                        )}>
                                            {isChecked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5 text-transparent" />}
                                        </div>
                                        <p className={cn(
                                            "text-sm font-bold leading-relaxed transition-colors",
                                            isChecked ? "text-indigo-900" : "text-slate-500"
                                        )}>
                                            {item.text}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Scientific Advice (Always visible) */}
            <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-8 space-y-4">
                <div className="flex items-center gap-2 text-slate-500">
                    <Brain className="w-5 h-5" />
                    <h4 className="text-sm font-black italic">Scientific Basis & Research Summary</h4>
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                    본 발달 지표는 K-DST 및 K-ASQ 등의 표준 발달 선별검사 항목을 기반으로 산출되었습니다.
                    전문 치료사가 작성한 정기 평가 데이터를 통해 아이의 성장 과정을 시각화하여 제공합니다.
                </p>
                <div className="h-px bg-slate-200 w-12"></div>
                <p className="text-[11px] text-rose-400 font-extrabold leading-relaxed">
                    ⚠️ 최종 판단은 반드시 전문의 또는 센터 전문가와 상담하시기 바랍니다.
                </p>
            </div>
        </div>
    );
}
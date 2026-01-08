import { Helmet } from 'react-helmet-async';
import { MessageCircle, Shapes, Volume2, BookOpen, Users2, BrainCircuit } from 'lucide-react';

export function ProgramsPage() {
    const programs = [
        {
            title: "언어치료",
            eng: "Speech Therapy",
            icon: <MessageCircle className="w-10 h-10 text-orange-500" />,
            desc: "의사소통에 어려움을 겪는 아동을 대상으로 언어 발달 상태를 평가하고, 적절한 언어 모델과 자극을 제공하여 의사소통 능력을 향상시킵니다.",
            targets: ["언어 발달이 또래보다 늦은 아동", "발음이 부정확한 아동", "말더듬이 있는 아동"]
        },
        {
            title: "놀이치료",
            eng: "Play Therapy",
            icon: <Shapes className="w-10 h-10 text-yellow-500" />,
            desc: "놀이를 주요 매개체로 사용하여 아동이 자신의 감정을 표현하고, 내면의 심리적 어려움을 해소하며, 건강한 자아상을 형성하도록 돕습니다.",
            targets: ["정서적으로 불안한 아동", "사회성이 부족한 아동", "공격적인 행동을 보이는 아동"]
        },
        {
            title: "감각통합치료",
            eng: "Sensory Integration",
            icon: <Volume2 className="w-10 h-10 text-green-500" />,
            desc: "다양한 감각 정보(시각, 청각, 촉각 등)를 효율적으로 처리하고 조직화하는 능력을 키워, 적절한 신체 반응과 행동을 유도합니다.",
            targets: ["특정 감각에 예민하거나 둔감한 아동", "대소근육 발달이 늦은 아동", "주의산만한 아동"]
        },
        {
            title: "인지학습치료",
            eng: "Cognitive Therapy",
            icon: <BookOpen className="w-10 h-10 text-blue-500" />,
            desc: "아동의 인지 발달 수준에 맞춰 주의력, 기억력, 사고력 등 기초 인지 능력을 향상시키고 학습에 필요한 기술을 습득하게 합니다.",
            targets: ["학습 장애가 의심되는 아동", "주의집중에 어려움이 있는 아동", "기초 학습 능력이 부족한 아동"]
        },
        {
            title: "사회성그룹치료",
            eng: "Social Group Therapy",
            icon: <Users2 className="w-10 h-10 text-indigo-500" />,
            desc: "또래와의 그룹 활동을 통해 규칙 지키기, 양보하기, 감정 표현하기 등 실질적인 사회적 기술을 연습하고 습득합니다.",
            targets: ["친구 관계 형성이 어려운 아동", "상호작용이 서툰 아동"]
        },
        {
            title: "발달검사/평가",
            eng: "Assessment",
            icon: <BrainCircuit className="w-10 h-10 text-purple-500" />,
            desc: "표준화된 검사 도구를 사용하여 아동의 현재 발달 수준과 심리 상태를 객관적으로 파악하고, 최적의 치료 계획을 수립합니다.",
            targets: ["모든 신규 내원 아동", "정기적인 발달 체크가 필요한 아동"]
        }
    ];

    return (
        <>
            <Helmet>
                <title>치료 프로그램 - 행복아동발달센터</title>
                <meta name="description" content="언어치료, 놀이치료, 감각통합치료 등 전문적인 발달 지원 프로그램을 안내합니다." />
            </Helmet>

            <div className="bg-orange-50/50 py-12 md:py-20">
                <div className="container mx-auto px-4 md:px-6 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">
                        프로그램 안내
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-slate-600 leading-relaxed">
                        아이의 고유한 특성을 존중하며,<br />
                        단계별 1:1 맞춤형 솔루션을 제공합니다.
                    </p>
                </div>
            </div>

            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {programs.map((program) => (
                            <div key={program.title} className="bg-white rounded-xl border p-8 hover:shadow-lg transition-all hover:-translate-y-1">
                                <div className="mb-6 bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center">
                                    {program.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-1">{program.title}</h3>
                                <p className="text-sm text-slate-500 mb-4">{program.eng}</p>
                                <p className="text-slate-600 text-sm leading-relaxed mb-6 min-h-[80px]">
                                    {program.desc}
                                </p>
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-sm mb-2 text-slate-800">추천 대상</h4>
                                    <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                                        {program.targets.map((target, idx) => (
                                            <li key={idx}>{target}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}

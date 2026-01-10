/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-10
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 이 파일의 UI/UX 설계 및 데이터 연동 로직은 독자적인 기술과
 * 예술적 영감을 바탕으로 구축되었습니다.
 */

export const DEFAULT_PROGRAMS = [
    {
        id: '1',
        title: "언어치료",
        eng: "Speech Therapy",
        icon_name: 'MessageCircle',
        desc: "의사소통에 어려움을 겪는 아동을 대상으로 언어 발달 상태를 평가하고, 적절한 언어 모델과 자극을 제공하여 의사소통 능력을 향상시킵니다.",
        targets: ["언어 발달이 또래보다 늦은 아동", "발음이 부정확한 아동", "말더듬이 있는 아동"]
    },
    {
        id: '2',
        title: "놀이치료",
        eng: "Play Therapy",
        icon_name: 'Shapes',
        desc: "놀이를 주요 매개체로 사용하여 아동이 자신의 감정을 표현하고, 내면의 심리적 어려움을 해소하며, 건강한 자아상을 형성하도록 돕습니다.",
        targets: ["정서적으로 불안한 아동", "사회성이 부족한 아동", "공격적인 행동을 보이는 아동"]
    },
    {
        id: '3',
        title: "감각통합치료",
        eng: "Sensory Integration",
        icon_name: 'Volume2',
        desc: "다양한 감각 정보(시각, 청각, 촉각 등)를 효율적으로 처리하고 조직화하는 능력을 키워, 적절한 신체 반응과 행동을 유도합니다.",
        targets: ["특정 감각에 예민하거나 둔감한 아동", "대소근육 발달이 늦은 아동", "주의산만한 아동"]
    },
    {
        id: '4',
        title: "인지학습치료",
        eng: "Cognitive Therapy",
        icon_name: 'BookOpen',
        desc: "아동의 인지 발달 수준에 맞춰 주의력, 기억력, 사고력 등 기초 인지 능력을 향상시키고 학습에 필요한 기술을 습득하게 합니다.",
        targets: ["학습 장애가 의심되는 아동", "주의집중에 어려움이 있는 아동", "기초 학습 능력이 부족한 아동"]
    },
    {
        id: '5',
        title: "사회성그룹치료",
        eng: "Social Group Therapy",
        icon_name: 'Users2',
        desc: "또래와의 그룹 활동을 통해 규칙 지키기, 양보하기, 감정 표현하기 등 실질적인 사회적 기술을 연습하고 습득합니다.",
        targets: ["친구 관계 형성이 어려운 아동", "상호작용이 서툰 아동"]
    },
    {
        id: '6',
        title: "발달검사/평가",
        eng: "Assessment",
        icon_name: 'BrainCircuit',
        desc: "표준화된 검사 도구를 사용하여 아동의 현재 발달 수준과 심리 상태를 객관적으로 파악하고, 최적의 치료 계획을 수립합니다.",
        targets: ["모든 신규 내원 아동", "정기적인 발달 체크가 필요한 아동"]
    }
];

// @ts-nocheck
/* eslint-disable */
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import {
    Heart, CheckCircle2, Star, Quote, ChevronDown, ArrowRight
} from 'lucide-react';

/**
 * ✨ [수정 가이드]
 * 페이지의 모든 문구와 이미지는 여기서 수정하세요.
 */
const HOME_CONTENT = {
    brandName: "행복아동발달센터",
    hero: {
        titleFirst: "아이의",
        titlePoint: "행복",
        titleLast: "이\n우리의 시작입니다",
        description: "전문적인 치료사와 따뜻한 환경 속에서\n우리 아이의 잠재력이 아름답게 피어납니다.",
        ctaText: "무료 상담 신청하기",
        bgImage: "https://images.unsplash.com/photo-1566438480900-0609be27a4be?auto=format&fit=crop&q=80&w=2000"
    },
    values: [
        {
            title: "근거 기반 치료",
            desc: "검증된 임상 데이터를 바탕으로 아이에게 가장 적합한 프로그램을 제안합니다.",
        },
        {
            title: "가족 중심 케어",
            desc: "아이를 넘어 부모님의 마음까지 세심하게 살피는 통합 지지 시스템을 운영합니다.",
        },
        {
            title: "지속적인 성장",
            desc: "치료실 밖에서도 아이의 성장이 이어지도록 체계적인 사후 관리를 제공합니다.",
        }
    ],
    story: {
        quote: "아이들의 웃음이\n자라나는 두 번째 집",
        description: "행복아동발달센터는 단순히 치료를 위한 공간을 넘어, 아이들이 정서적으로 안정을 찾고 스스로의 힘을 키워가는 따뜻한 보금자리를 지향합니다.",
        image: "https://images.unsplash.com/photo-1587653263995-422546a72569?auto=format&fit=crop&q=80&w=1200"
    },
    footer: {
        address: "경기도 어느시 어느구 어느동 123-456",
        contact: "Tel: 02-1234-5678 | Email: help@happiness.com",
        copyright: "© 2026 Happiness Center. All rights reserved."
    }
};

export function HomePage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
            <Helmet>
                <title>{HOME_CONTENT.brandName} - 아이의 행복한 성장을 함께합니다</title>
            </Helmet>

            {/* 1. 메인 비주얼 섹션 (Hero) */}
            <section className="relative h-[85vh] flex items-center overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
                    style={{ backgroundImage: `url(${HOME_CONTENT.hero.bgImage})` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/50 to-transparent"></div>
                </div>

                <div className="container relative z-10 mx-auto px-8 md:px-12">
                    <div className="max-w-2xl space-y-10 animate-in fade-in slide-in-from-left-10 duration-1000">
                        <div className="w-12 h-1.5 bg-primary rounded-full"></div>

                        <h1 className="text-5xl md:text-7xl font-black leading-[1.15] tracking-tight text-slate-900 whitespace-pre-line">
                            {HOME_CONTENT.hero.titleFirst} <span className="text-primary">{HOME_CONTENT.hero.titlePoint}</span>
                            {HOME_CONTENT.hero.titleLast}
                        </h1>

                        <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-lg whitespace-pre-line">
                            {HOME_CONTENT.hero.description}
                        </p>

                        <div className="flex gap-4 pt-6">
                            <Link to="/contact" className="group px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-3">
                                {HOME_CONTENT.hero.ctaText}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-30">
                    <ChevronDown className="w-8 h-8" />
                </div>
            </section>

            {/* 2. 센터 철학 섹션 */}
            <section className="py-32 bg-slate-50">
                <div className="container mx-auto px-8 md:px-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                        {HOME_CONTENT.values.map((item, idx) => (
                            <ValueItem
                                key={idx}
                                icon={idx === 0 ? <Star className="w-10 h-10 text-primary" /> : idx === 1 ? <Heart className="w-10 h-10 text-primary" /> : <CheckCircle2 className="w-10 h-10 text-primary" />}
                                title={item.title}
                                desc={item.desc}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. 브랜드 이미지 섹션 */}
            <section className="py-32">
                <div className="container mx-auto px-8 md:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="order-2 lg:order-1 space-y-8">
                            <Quote className="w-12 h-12 text-primary opacity-20" />
                            <h3 className="text-4xl md:text-5xl font-black leading-tight text-slate-900 whitespace-pre-line">
                                {HOME_CONTENT.story.quote}
                            </h3>
                            <p className="text-lg text-slate-500 font-medium leading-relaxed">
                                {HOME_CONTENT.story.description}
                            </p>
                        </div>
                        <div className="order-1 lg:order-2">
                            <img
                                src={HOME_CONTENT.story.image}
                                alt="Center Concept"
                                className="w-full h-[500px] object-cover rounded-[50px] shadow-2xl border-[16px] border-white"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. 심플 푸터 */}
            <footer className="bg-white border-t border-slate-100 py-16">
                <div className="container mx-auto px-8 md:px-12">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="text-center md:text-left space-y-2">
                            <h2 className="text-2xl font-black text-slate-900">{HOME_CONTENT.brandName}</h2>
                            <p className="text-xs text-slate-400 font-bold max-w-xs leading-relaxed">
                                {HOME_CONTENT.footer.address}<br />{HOME_CONTENT.footer.contact}
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-8 text-xs font-black text-slate-400">
                            <Link to="/login" className="hover:text-primary transition-colors">시스템 로그인</Link>
                            <Link to="/register" className="hover:text-primary transition-colors">파트너 가입</Link>
                            <p>{HOME_CONTENT.footer.copyright}</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function ValueItem({ icon, title, desc }) {
    return (
        <div className="space-y-6">
            <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center shadow-sm border border-slate-100">{icon}</div>
            <h3 className="text-2xl font-black text-slate-900">{title}</h3>
            <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
        </div>
    );
}
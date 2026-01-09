// @ts-nocheck
/* eslint-disable */
/**
 * ============================================
 * 🎨 ZARADA PREMIUM - AboutPage
 * ============================================
 */
import { Helmet } from 'react-helmet-async';
import { Award, Heart, Users, Clock, Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAdminSettings } from '@/hooks/useAdminSettings';

export function AboutPage() {
    const { getSetting } = useAdminSettings();

    const introText = getSetting('about_intro_text') || "아이는 믿는 만큼 자라고, 사랑받는 만큼 행복해집니다.\n행복아동발달센터는 아이들의 건강한 성장을 위해 진심을 다합니다.";
    const mainImage = getSetting('about_main_image');
    const descTitle = getSetting('about_desc_title') || "따뜻한 시선으로\n아이의 잠재력을 발굴합니다";
    const descBody = getSetting('about_desc_body') || "행복아동발달센터는 각 분야별 석/박사 출신의 전문 치료진들이 협력하여 아동 개개인에게 최적화된 맞춤 치료 프로그램을 제공합니다.\n\n단순히 증상을 개선하는 것을 넘어, 아이가 스스로 긍정적인 자아를 형성하고 세상과 소통하며 행복하게 살아갈 수 있도록 돕는 것이 우리의 목표입니다.";

    const values = [
        { icon: <Award className="w-7 h-7" />, title: "검증된 전문성", desc: "석/박사급 치료진의 체계적 접근", color: "bg-indigo-50 text-indigo-600" },
        { icon: <Heart className="w-7 h-7" />, title: "진정성 있는 치료", desc: "아이 중심의 따뜻한 케어", color: "bg-rose-50 text-rose-600" },
        { icon: <Users className="w-7 h-7" />, title: "체계적인 협진", desc: "다학제적 협력 시스템", color: "bg-emerald-50 text-emerald-600" },
        { icon: <Clock className="w-7 h-7" />, title: "충분한 상담", desc: "부모님과의 깊은 소통", color: "bg-amber-50 text-amber-600" },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Helmet>
                <title>센터 소개 - 행복아동발달센터</title>
                <meta name="description" content="따뜻한 마음과 전문성을 갖춘 행복아동발달센터의 치료진을 소개합니다." />
            </Helmet>

            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 py-24 px-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full blur-2xl"></div>

                <div className="container mx-auto max-w-4xl relative z-10 text-center text-white">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black tracking-wider uppercase mb-6">
                            About Us
                        </span>
                        <h1
                            className="text-4xl md:text-5xl font-black tracking-[-0.05em] mb-6"
                            style={{ wordBreak: 'keep-all' }}
                        >
                            센터 소개
                        </h1>
                        <p
                            className="text-lg text-white/80 font-medium max-w-xl mx-auto leading-relaxed whitespace-pre-line"
                            style={{ wordBreak: 'keep-all' }}
                        >
                            {introText}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Floating Cards Container */}
            <div className="bg-[#F8FAFC] relative -mt-12 z-20 rounded-t-[50px] px-4 pb-24">
                <div className="container mx-auto max-w-5xl">

                    {/* Values Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-16">
                        {values.map((item, idx) => (
                            <motion.div
                                key={idx}
                                className="bg-white rounded-[28px] p-6 shadow-lg shadow-slate-100 border border-slate-100 text-center"
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ type: "spring", stiffness: 100, delay: idx * 0.1 }}
                            >
                                <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mb-4 mx-auto`}>
                                    {item.icon}
                                </div>
                                <h3 className="font-black text-slate-800 text-sm mb-1">{item.title}</h3>
                                <p className="text-xs text-slate-400 font-medium">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Main Content Card */}
                    <motion.div
                        className="mt-16 bg-white rounded-[50px] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-100"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            <div className="relative h-[350px] lg:h-auto">
                                {mainImage ? (
                                    <img src={mainImage} alt="Center View" className="absolute inset-0 w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-400 font-medium">
                                        센터 전경 이미지
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent lg:bg-gradient-to-r"></div>
                            </div>
                            <div className="p-10 md:p-16 flex flex-col justify-center space-y-6">
                                <h2
                                    className="text-3xl font-black text-slate-900 tracking-[-0.05em] leading-tight whitespace-pre-line"
                                    style={{ wordBreak: 'keep-all' }}
                                >
                                    {descTitle}
                                </h2>
                                <p
                                    className="text-slate-500 font-medium leading-relaxed whitespace-pre-line"
                                    style={{ wordBreak: 'keep-all' }}
                                >
                                    {descBody}
                                </p>
                                <Link
                                    to="/contact"
                                    className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline mt-4"
                                >
                                    상담 예약하기 <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

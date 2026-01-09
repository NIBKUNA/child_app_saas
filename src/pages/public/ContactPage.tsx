// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import { MapPin, Clock, Calendar } from 'lucide-react';
import { ConsultationSurveyForm } from '@/components/public/ConsultationSurveyForm';
import { useAdminSettings } from '@/hooks/useAdminSettings';

export function ContactPage() {
    const { getSetting, loading } = useAdminSettings(); // ✨ 운영시간 가져오기
    const [centerInfo, setCenterInfo] = useState<any>(null);

    // ✨ 센터 행정 정보 가져오기
    useEffect(() => {
        const fetchCenter = async () => {
            const { data } = await supabase.from('centers').select('*').limit(1).single();
            if (data) setCenterInfo(data);
        };
        fetchCenter();
    }, []);

    return (
        <>
            <Helmet>
                <title>문의 및 오시는 길 - {centerInfo?.name || '센터'}</title>
                <meta name="description" content="센터 위치 안내, 운영 시간, 상담 예약 문의 방법을 안내해드립니다." />
            </Helmet>

            <div className="bg-orange-50/50 py-12 md:py-20">
                <div className="container mx-auto px-4 md:px-6 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">
                        문의 및 오시는 길
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-slate-600 leading-relaxed">
                        궁금하신 점이 있다면 언제든 편하게 문의해주세요.<br />
                        친절하고 상세하게 안내해 드리겠습니다.
                    </p>
                </div>
            </div>

            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
                        {/* Information Section */}
                        <div className="space-y-8 h-fit lg:sticky lg:top-24">
                            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
                                <h2 className="text-xl font-black flex items-center gap-2 text-slate-900">
                                    <MapPin className="text-indigo-600 w-6 h-6" /> 센터 정보
                                </h2>
                                <div className="space-y-4 text-slate-600">
                                    <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl">
                                        <div className="shrink-0 font-bold text-slate-900">주소</div>
                                        <div className="text-sm">{centerInfo?.address || '주소 정보가 없습니다.'}</div>
                                    </div>
                                    <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl">
                                        <div className="shrink-0 font-bold text-slate-900">전화</div>
                                        <div className="text-sm font-bold text-lg text-slate-800">{centerInfo?.phone || '02-000-0000'}</div>
                                    </div>
                                    <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl">
                                        <div className="shrink-0 font-bold text-slate-900">이메일</div>
                                        <div className="text-sm">{centerInfo?.email || 'contact@center.com'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
                                <h2 className="text-xl font-black flex items-center gap-2 text-slate-900">
                                    <Clock className="text-indigo-600 w-6 h-6" /> 운영 시간
                                </h2>
                                <div className="space-y-4 text-slate-600">
                                    <div className="flex justify-between border-b border-slate-100 pb-3">
                                        <span className="font-bold">평일 (월-금)</span>
                                        {/* ✨ DB centers 테이블 연동 */}
                                        <span className="font-bold text-slate-900">{centerInfo?.weekday_hours || '09:00 - 19:00'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-3">
                                        <span className="font-bold">토요일</span>
                                        {/* ✨ DB centers 테이블 연동 */}
                                        <span className="font-bold text-slate-900">{centerInfo?.saturday_hours || '09:00 - 16:00'}</span>
                                    </div>
                                    <div className="flex justify-between text-rose-500 font-black">
                                        <span>일요일/공휴일</span>
                                        {/* ✨ DB centers 테이블 연동 */}
                                        <span>{centerInfo?.holiday_text || '휴무'}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 bg-orange-50 p-4 rounded-xl leading-relaxed font-medium">
                                    * 모든 상담 및 치료는 100% 예약제로 운영됩니다.<br />
                                    * 방문 전 반드시 예약 부탁드립니다.
                                </p>
                            </div>
                        </div>

                        {/* Inquiry Form Section */}
                        <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-200 shadow-2xl shadow-indigo-600/5">
                            <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-900">
                                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                상담 예약 신청
                            </h2>
                            <ConsultationSurveyForm />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MapPin, Phone, Mail, Clock, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function ContactPage() {
    const [loading, setLoading] = useState(false);

    // Form States
    const [name, setName] = useState('');
    const [childName, setChildName] = useState('');
    const [phone, setPhone] = useState('');
    const [category, setCategory] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !phone || !message) {
            alert('필수 정보를 모두 입력해주세요.');
            return;
        }

        setLoading(true);

        // Prepare the payload mapping to the 'leads' table structure
        const payload = {
            parent_name: name,
            child_name: childName, // Optional
            phone: phone,
            concern: message,
            preferred_service: category ? [category] : [], // Array type
            status: 'new',
            source: 'website_contact_page'
        };

        const { error } = await (supabase
            .from('leads') as any)
            .insert([payload]);

        setLoading(false);

        if (error) {
            console.error('Error submitting lead:', error);
            alert('접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else {
            alert('상담 신청이 성공적으로 접수되었습니다! 담당자가 확인 후 연락드리겠습니다.');
            // Clear form
            setName('');
            setChildName('');
            setPhone('');
            setCategory('');
            setMessage('');
        }
    };

    return (
        <>
            <Helmet>
                <title>문의 및 오시는 길 - 행복아동발달센터</title>
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
                    <div className="grid gap-12 lg:grid-cols-2">
                        {/* Information Section */}
                        <div className="space-y-8">
                            <div className="bg-white p-8 rounded-xl border shadow-sm space-y-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <MapPin className="text-primary" /> 센터 정보
                                </h2>
                                <div className="space-y-4 text-slate-600">
                                    <div className="flex gap-4">
                                        <div className="shrink-0 w-24 font-medium text-slate-900">주소</div>
                                        <div>서울시 강남구 테헤란로 123 행복빌딩 3층<br />(역삼역 3번 출구 도보 5분)</div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="shrink-0 w-24 font-medium text-slate-900">전화</div>
                                        <div>02-1234-5678</div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="shrink-0 w-24 font-medium text-slate-900">이메일</div>
                                        <div>contact@happycenter.com</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-xl border shadow-sm space-y-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Clock className="text-primary" /> 운영 시간
                                </h2>
                                <div className="space-y-4 text-slate-600">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="font-medium">평일 (월-금)</span>
                                        <span>09:00 - 19:00</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="font-medium">토요일</span>
                                        <span>09:00 - 16:00</span>
                                    </div>
                                    <div className="flex justify-between text-destructive font-medium">
                                        <span>일요일/공휴일</span>
                                        <span>휴무</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded mt-4">
                                    * 모든 상담 및 치료는 100% 예약제로 운영됩니다.<br />
                                    * 방문 전 전화 또는 상담 예약을 부탁드립니다.
                                </p>
                            </div>
                        </div>

                        {/* Inquiry Form Section */}
                        <div className="bg-white p-8 rounded-xl border shadow-lg h-fit">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Calendar className="text-primary" /> 상담 예약 신청
                            </h2>
                            <form className="space-y-4" onSubmit={handleSubmit}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-sm font-medium leading-none">보호자 성함 <span className="text-red-500">*</span></label>
                                        <input
                                            id="name"
                                            required
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            placeholder="홍길동"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="child-name" className="text-sm font-medium leading-none">아동 이름</label>
                                        <input
                                            id="child-name"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            placeholder="홍길순"
                                            value={childName}
                                            onChange={(e) => setChildName(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-medium leading-none">연락처 <span className="text-red-500">*</span></label>
                                    <input
                                        id="phone"
                                        required
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="010-1234-5678"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="category" className="text-sm font-medium leading-none">상담 분야</label>
                                    <select
                                        id="category"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                    >
                                        <option value="">선택해주세요</option>
                                        <option value="language">언어치료</option>
                                        <option value="play">놀이치료</option>
                                        <option value="sensory">감각통합치료</option>
                                        <option value="cognition">인지학습치료</option>
                                        <option value="social">사회성그룹</option>
                                        <option value="assessment">발달검사</option>
                                        <option value="etc">기타</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="message" className="text-sm font-medium leading-none">문의 내용 <span className="text-red-500">*</span></label>
                                    <textarea
                                        id="message"
                                        required
                                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                                        placeholder="아이의 연령, 거주지, 주요 고민 등을 간단히 적어주세요."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            전송 중...
                                        </>
                                    ) : (
                                        '상담 신청하기'
                                    )}
                                </button>
                                <p className="text-xs text-center text-muted-foreground mt-4">
                                    신청해주시면 확인 후 담당자가 개별적으로 연락드립니다.
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

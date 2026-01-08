import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Instagram, Facebook } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-slate-50 border-t">
            <div className="container mx-auto px-4 md:px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <Link to="/" className="font-bold text-xl text-primary flex items-center gap-2">
                            <span className="text-2xl">🧸</span>
                            <span>행복아동발달센터</span>
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            아이들의 꿈과 희망을 키우는<br />
                            따뜻한 발달 지원 전문 기관입니다.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">센터 정보</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <MapPin size={16} className="mt-0.5 shrink-0" />
                                <span>서울시 강남구 테헤란로 123<br />행복빌딩 3층</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone size={16} />
                                <span>02-1234-5678</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Mail size={16} />
                                <span>contact@happycenter.com</span>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">바로가기</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link to="/about" className="hover:text-primary transition-colors">센터 소개</Link></li>
                            <li><Link to="/programs" className="hover:text-primary transition-colors">프로그램</Link></li>
                            <li><Link to="/therapists" className="hover:text-primary transition-colors">치료사 소개</Link></li>
                            <li><Link to="/contact" className="hover:text-primary transition-colors">오시는 길</Link></li>
                            <li><Link to="/contact" className="hover:text-primary transition-colors">상담 문의</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">운영 시간</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex justify-between">
                                <span>평일</span>
                                <span>09:00 - 19:00</span>
                            </li>
                            <li className="flex justify-between">
                                <span>토요일</span>
                                <span>09:00 - 16:00</span>
                            </li>
                            <li className="flex justify-between text-destructive">
                                <span>방문 상담</span>
                                <span>예약 필수</span>
                            </li>
                            <li className="mt-4 pt-4 border-t flex gap-4">
                                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                    <Instagram size={20} />
                                </a>
                                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                    <Facebook size={20} />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t text-center text-xs text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} 행복아동발달센터. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

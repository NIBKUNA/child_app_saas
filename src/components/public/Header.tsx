// @ts-nocheck
/* eslint-disable */
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const LOGO_CACHE_KEY = 'cached_center_logo';
const NAME_CACHE_KEY = 'cached_center_name';

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    // ✨ [Instant Logo/Name] 기존 캐시 로직 100% 유지
    const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem(LOGO_CACHE_KEY) || '');
    const [centerName, setCenterName] = useState(() => localStorage.getItem(NAME_CACHE_KEY) || '행복아동발달센터');
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                // 1. admin_settings에서 로고와 이름 가져오기
                const { data: settingsData } = await supabase
                    .from('admin_settings')
                    .select('key, value')
                    .in('key', ['center_logo', 'center_name']);

                let finalLogo = '';
                let finalName = '';

                if (settingsData) {
                    settingsData.forEach((item: any) => {
                        if (item.key === 'center_logo') finalLogo = item.value;
                        if (item.key === 'center_name') finalName = item.value;
                    });
                }

                // 2. 만약 center_name이 비어있다면 centers 테이블에서 공식 명칭 가져오기 (보완 로직)
                if (!finalName) {
                    const { data: centerData } = await supabase.from('centers').select('name').limit(1).single();
                    if (centerData?.name) finalName = centerData.name;
                }

                // 3. 상태 업데이트 및 캐싱
                if (finalLogo) {
                    setLogoUrl(finalLogo);
                    localStorage.setItem(LOGO_CACHE_KEY, finalLogo);
                }
                if (finalName) {
                    setCenterName(finalName);
                    localStorage.setItem(NAME_CACHE_KEY, finalName);
                }
            } catch (error) {
                console.error('Failed to fetch branding:', error);
            }
        };
        fetchBranding();
    }, []);

    const navigation = [
        { name: '홈', href: '/' },
        { name: '센터 소개', href: '/about' },
        { name: '프로그램', href: '/programs' },
        { name: '문의하기', href: '/contact' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/70 backdrop-blur-md shadow-sm supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
                            {logoUrl ? (
                                <div className={`h-8 min-w-[100px] flex items-center ${!imageLoaded ? 'logo-skeleton' : ''}`}>
                                    <img
                                        src={logoUrl}
                                        alt={centerName}
                                        className={`h-8 w-auto object-contain transition-opacity duration-150 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                        loading="eager"
                                        onLoad={() => setImageLoaded(true)}
                                        onError={() => {
                                            localStorage.removeItem(LOGO_CACHE_KEY);
                                            setLogoUrl('');
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">🧸</span>
                                    {/* ✨ 실시간 센터명 반영 */}
                                    <span>{centerName}</span>
                                </div>
                            )}
                        </Link>
                    </div>

                    <nav className="hidden md:flex items-center gap-6 text-left">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-primary",
                                    isActive(item.href) ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">로그인</Link>
                            <Link to="/contact" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">상담 예약</Link>
                        </div>
                    </nav>

                    <button className="md:hidden p-2 text-muted-foreground" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden border-t text-left">
                    <div className="container mx-auto px-4 py-4 space-y-2">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn("block px-3 py-2 rounded-md text-base font-medium transition-colors",
                                    isActive(item.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent")}
                                onClick={() => setIsMenuOpen(false)}
                            >{item.name}</Link>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
}
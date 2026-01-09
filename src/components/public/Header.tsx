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

    // ✨ [Instant Logo] localStorage에서 캐시된 값을 바로 사용 (플리커 방지)
    const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem(LOGO_CACHE_KEY) || '');
    const [centerName, setCenterName] = useState(() => localStorage.getItem(NAME_CACHE_KEY) || '행복아동발달센터');
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                const { data } = await (supabase.from('admin_settings') as any)
                    .select('key, value')
                    .in('key', ['center_logo', 'center_name']);

                if (data) {
                    const settings: Record<string, string> = {};
                    data.forEach((item: any) => { settings[item.key] = item.value; });

                    if (settings.center_logo) {
                        setLogoUrl(settings.center_logo);
                        localStorage.setItem(LOGO_CACHE_KEY, settings.center_logo);
                    }
                    if (settings.center_name) {
                        setCenterName(settings.center_name);
                        localStorage.setItem(NAME_CACHE_KEY, settings.center_name);
                    }
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
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
                            {/* ✨ [Zero Flicker] 로고 URL이 캐시에 있으면 무조건 이미지 영역 표시 */}
                            {logoUrl ? (
                                <div className={`h-8 min-w-[100px] flex items-center ${!imageLoaded ? 'logo-skeleton' : ''}`}>
                                    <img
                                        src={logoUrl}
                                        alt={centerName}
                                        className={`h-8 w-auto object-contain transition-opacity duration-150 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                        loading="eager"
                                        fetchPriority="high"
                                        decoding="sync"
                                        onLoad={() => setImageLoaded(true)}
                                        onError={() => {
                                            localStorage.removeItem(LOGO_CACHE_KEY);
                                            setLogoUrl('');
                                        }}
                                    />
                                </div>
                            ) : (
                                /* 로고가 없을 때만 텍스트 표시 (캐시에 URL 없음 = 로고 미설정) */
                                <>
                                    <span className="text-2xl">🧸</span>
                                    <span>{centerName}</span>
                                </>
                            )}
                        </Link>
                    </div>

                    <nav className="hidden md:flex items-center gap-6">
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
                            <Link
                                to="/login"
                                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                            >
                                로그인
                            </Link>
                            <Link
                                to="/contact"
                                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                상담 예약
                            </Link>
                        </div>
                    </nav>

                    <button
                        className="md:hidden p-2 text-muted-foreground"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden border-t">
                    <div className="container mx-auto px-4 py-4 space-y-2">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "block px-3 py-2 rounded-md text-base font-medium transition-colors",
                                    isActive(item.href)
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <div className="pt-4 mt-4 border-t space-y-2">
                            <Link
                                to="/login"
                                className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                로그인
                            </Link>
                            <Link
                                to="/contact"
                                className="block w-full text-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                상담 예약
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

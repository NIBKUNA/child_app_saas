import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

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
                            <span className="text-2xl">🧸</span>
                            <span>행복아동발달센터</span>
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

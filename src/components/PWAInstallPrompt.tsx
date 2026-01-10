import { useState, useEffect } from 'react';
import { Share, X, Download } from 'lucide-react';

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(ios);

        // Capture install event (Android/PC)
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // Show prompt after 5 seconds
        const timer = setTimeout(() => {
            // Check if already installed (standalone mode)
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            if (!isStandalone) {
                setShowPrompt(true);
            }
        }, 5000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            clearTimeout(timer);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-900/90 backdrop-blur-md text-white p-5 rounded-[24px] shadow-2xl border border-slate-700 relative">
                <button
                    onClick={() => setShowPrompt(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-start gap-4 pr-6">
                    <img src="/pwa-192x192.png" alt="App Icon" className="w-12 h-12 rounded-xl shadow-lg bg-white" />
                    <div>
                        <h4 className="font-bold text-lg mb-1">앱으로 더 편하게!</h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            자라다 앱을 설치하고 소식을 빠르게 받아보세요.
                        </p>
                    </div>
                </div>

                {isIOS ? (
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                        <p className="text-sm font-bold text-indigo-300 mb-2 flex items-center gap-2">
                            <span className="bg-slate-800 p-1.5 rounded-lg"><Share className="w-4 h-4" /></span>
                            버튼을 누르고 '홈 화면에 추가' 선택
                        </p>
                        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                            <div className="w-2/3 h-full bg-indigo-500 animate-pulse"></div>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={handleInstallClick}
                        className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        지금 설치하기
                    </button>
                )}
            </div>
        </div>
    );
}

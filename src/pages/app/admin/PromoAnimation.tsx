import { Globe, Server, Shield, CheckCircle, ExternalLink, Copy, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeProvider';

/**
 * 🌐 커스텀 도메인 설정 가이드
 * Super Admin 전용 — 새 센터에 커스텀 도메인을 연결할 때 필요한 단계 안내
 */
export function DomainGuide() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [copiedText, setCopiedText] = useState('');

    const copy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedText(text);
        setTimeout(() => setCopiedText(''), 2000);
    };

    const CopyButton = ({ text }: { text: string }) => (
        <button
            onClick={() => copy(text)}
            className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all",
                copiedText === text
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400"
            )}
        >
            {copiedText === text ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copiedText === text ? '복사됨' : '복사'}
        </button>
    );

    const steps = [
        {
            icon: Globe,
            title: '1. 도메인 구매',
            color: 'text-blue-500',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            content: (
                <div className="space-y-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        <a href="https://www.gabia.com" target="_blank" rel="noopener" className="text-blue-500 font-bold hover:underline">가비아</a>,&nbsp;
                        <a href="https://www.hosting.kr" target="_blank" rel="noopener" className="text-blue-500 font-bold hover:underline">호스팅KR</a> 등에서 원하는 도메인을 구매합니다.
                    </p>
                    <div className={cn("rounded-xl p-3 text-sm font-mono", isDark ? "bg-slate-900 text-slate-300" : "bg-slate-800 text-slate-200")}>
                        예: mychildcenter.co.kr
                    </div>
                </div>
            )
        },
        {
            icon: Server,
            title: '2. DNS 레코드 설정',
            color: 'text-purple-500',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
            content: (
                <div className="space-y-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        도메인 관리 페이지에서 아래 DNS 레코드를 추가하세요.
                    </p>
                    <div className={cn("rounded-xl p-4 space-y-2 text-sm font-mono", isDark ? "bg-slate-900" : "bg-slate-800")}>
                        <div className="flex items-center justify-between">
                            <span className="text-emerald-400">CNAME → cname.vercel-dns.com</span>
                            <CopyButton text="cname.vercel-dns.com" />
                        </div>
                        <div className="border-t border-slate-700 pt-2 flex items-center justify-between">
                            <span className="text-yellow-400">또는 A → 76.76.21.21</span>
                            <CopyButton text="76.76.21.21" />
                        </div>
                    </div>
                    <p className="text-xs text-slate-500">※ CNAME은 서브도메인, A 레코드는 루트 도메인에 사용</p>
                </div>
            )
        },
        {
            icon: Shield,
            title: '3. Vercel에 도메인 추가',
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
            content: (
                <div className="space-y-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Vercel 프로젝트 설정에서 커스텀 도메인을 추가합니다.
                    </p>
                    <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                        <li><a href="https://vercel.com/dashboard" target="_blank" rel="noopener" className="text-emerald-500 font-bold hover:underline">Vercel Dashboard</a> → 프로젝트 선택</li>
                        <li>Settings → Domains</li>
                        <li>새 도메인 입력 → Add</li>
                        <li>SSL 인증서 자동 발급 확인 (수 분 소요)</li>
                    </ol>
                </div>
            )
        },
        {
            icon: ArrowRight,
            title: '4. 센터에 도메인 연결',
            color: 'text-orange-500',
            bgColor: 'bg-orange-50 dark:bg-orange-900/20',
            content: (
                <div className="space-y-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        마스터 콘솔 → 해당 센터 상세 → <strong>커스텀 도메인</strong> 필드에 도메인 입력 후 저장
                    </p>
                    <div className={cn("rounded-xl p-3 text-sm font-mono", isDark ? "bg-slate-900 text-slate-300" : "bg-slate-800 text-slate-200")}>
                        mychildcenter.co.kr <span className="text-slate-500">(http 제외, www 제외)</span>
                    </div>
                </div>
            )
        },
        {
            icon: CheckCircle,
            title: '5. 네이버 서치어드바이저 등록 (선택)',
            color: 'text-teal-500',
            bgColor: 'bg-teal-50 dark:bg-teal-900/20',
            content: (
                <div className="space-y-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        네이버 검색 노출을 원하면 커스텀 도메인을 별도 등록해야 합니다.
                    </p>
                    <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                        <li><a href="https://searchadvisor.naver.com" target="_blank" rel="noopener" className="text-teal-500 font-bold hover:underline">서치어드바이저 <ExternalLink className="w-3 h-3 inline" /></a> 접속</li>
                        <li>사이트 추가 → 커스텀 도메인 입력</li>
                        <li>소유권 인증 (HTML 태그 또는 DNS)</li>
                        <li>요청 → 사이트맵 제출</li>
                    </ol>
                    <p className="text-xs text-slate-500">※ app.myparents.co.kr 경로로 접속하는 센터는 별도 등록 불필요 (메인 사이트맵에 포함됨)</p>
                </div>
            )
        },
    ];

    return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                    커스텀 도메인 설정 가이드
                </h1>
                <p className="text-sm text-slate-500 font-bold mt-2">
                    새 센터에 자체 도메인을 연결하는 단계별 안내
                </p>
            </div>

            {/* 자동 처리 안내 */}
            <div className={cn("rounded-2xl p-5 border", isDark ? "bg-indigo-900/20 border-indigo-800" : "bg-indigo-50 border-indigo-200")}>
                <h3 className="text-sm font-black text-indigo-600 dark:text-indigo-400 mb-2">💡 자동 처리되는 것</h3>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <li>✅ 지역 SEO (title, description, keywords) — 센터 주소에서 자동 추출</li>
                    <li>✅ JSON-LD 구조화 데이터 — 센터 정보 기반 자동 생성</li>
                    <li>✅ 사이트맵 — 빌드 시 자동 갱신 (prebuild)</li>
                    <li>✅ 센터별 HTML SEO 태그 — 빌드 시 자동 생성 (postbuild)</li>
                    <li>✅ Canonical URL — 커스텀 도메인 자동 감지</li>
                </ul>
            </div>

            {/* 단계별 가이드 */}
            <div className="space-y-4">
                {steps.map((step, i) => (
                    <div key={i} className={cn("rounded-2xl p-5 border transition-all", isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200 shadow-sm")}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={cn("p-2 rounded-xl", step.bgColor)}>
                                <step.icon className={cn("w-5 h-5", step.color)} />
                            </div>
                            <h2 className="text-base font-black text-slate-900 dark:text-white">{step.title}</h2>
                        </div>
                        {step.content}
                    </div>
                ))}
            </div>

            {/* 요약 */}
            <div className={cn("rounded-2xl p-5 border", isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200")}>
                <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-3">📋 체크리스트 요약</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-600" /> 도메인 구매
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-600" /> DNS CNAME/A 레코드 설정
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-600" /> Vercel에 도메인 추가
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-600" /> 마스터 콘솔에서 도메인 입력
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-600" /> 접속 확인
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-600" /> 네이버 서치어드바이저 등록 (선택)
                    </div>
                </div>
            </div>
        </div>
    );
}

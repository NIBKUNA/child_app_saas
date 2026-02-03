import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, FileText } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useCenter } from '@/contexts/CenterContext';

export const LegalPage = ({ type }: { type: 'privacy' | 'terms' }) => {
    const navigate = useNavigate();
    const { center } = useCenter();

    const centerName = center?.name || '아동발달센터';

    const content = type === 'privacy' ? {
        title: "개인정보처리방침",
        icon: <Shield className="w-8 h-8 text-indigo-600" />,
        text: `${centerName}(이하 '회사')는 이용자의 개인정보를 중요시하며, "개인정보보호법" 등 관련 법령을 준수하고 있습니다.

1. 수집하는 개인정보 항목
- 성명, 연락처, 이메일, 센터명, 아이 정보 등

2. 수집 및 이용목적
- 서비스 이용에 따른 본인 식별, 상담 신청 처리, 서비스 품질 개선

3. 보유 및 이용기간
- 서비스 해지 시 또는 목적 달성 시까지 (단, 관계 법령에 따라 보존이 필요한 경우 해당 기간까지)

기타 자세한 사항은 고객센터로 문의해 주시기 바랍니다.`
    } : {
        title: "서비스 이용약관",
        icon: <FileText className="w-8 h-8 text-indigo-600" />,
        text: `본 약관은 ${centerName}(이하 '회사')가 제공하는 모든 서비스의 이용 조건 및 절차에 관한 의무 사항을 규정함을 목적으로 합니다.

1. 서비스의 제공 및 변경
- 회사는 아동발달센터 관리 및 관련 서비스를 제공합니다.

2. 이용자의 의무
- 이용자는 본 약관 및 관련 법령을 준수해야 하며, 타인의 권리를 침해해서는 안 됩니다.

3. 서비스 이용 제한
- 부적절한 이용 시 서비스 이용이 제한될 수 있습니다.

본 약관은 공지 후 즉시 효력이 발생합니다.`
    };

    return (
        <div className="min-h-screen bg-slate-50 py-20 px-4">
            <Helmet>
                <title>{content.title} - {centerName}</title>
                <meta name="description" content={`${centerName}의 ${content.title} 안내입니다.`} />
            </Helmet>

            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold mb-8 transition-colors"
                >
                    <ArrowLeft size={20} />
                    이전으로
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[40px] shadow-xl shadow-slate-200/50 p-8 md:p-16 border border-slate-100"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
                            {content.icon}
                        </div>
                        <h1 className="text-3xl font-black text-slate-900">{content.title}</h1>
                    </div>

                    <div className="prose prose-slate max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-slate-600 leading-relaxed bg-transparent border-none p-0 text-base">
                            {content.text}
                        </pre>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

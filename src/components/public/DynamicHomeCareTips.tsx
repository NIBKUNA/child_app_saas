import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles } from 'lucide-react';

interface DynamicHomeCareTipsProps {
    latestAssessment: any;
}

export function DynamicHomeCareTips({ latestAssessment }: DynamicHomeCareTipsProps) {
    const [tips, setTips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTips() {
            if (!latestAssessment) {
                setLoading(false);
                return;
            }

            // 1. Calculate lowest domain
            const scores = [
                { id: 'communication', val: latestAssessment.score_communication || 0 },
                { id: 'social', val: latestAssessment.score_social || 0 },
                { id: 'cognitive', val: latestAssessment.score_cognitive || 0 },
                { id: 'motor', val: latestAssessment.score_motor || 0 },
                { id: 'adaptive', val: latestAssessment.score_adaptive || 0 },
            ];

            // Sort by score ascending
            scores.sort((a, b) => a.val - b.val);
            const lowestDomain = scores[0].id;

            // 2. Fetch tips from DB
            const { data } = await supabase
                .from('home_care_tips')
                .select('*')
                .eq('category', lowestDomain)
                .limit(3);

            if (data) setTips(data);
            setLoading(false);
        }

        fetchTips();
    }, [latestAssessment]);

    if (!latestAssessment) {
        return (
            <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold text-sm">아직 맞춤 팁을 분석 중입니다.</p>
                <p className="text-xs text-slate-300 mt-1">발달 평가가 등록되면 아이에게 딱 맞는 팁을 추천해드려요!</p>
            </div>
        );
    }

    if (loading) return <div className="p-10 text-center text-slate-400">맞춤 팁을 로딩중입니다...</div>;

    if (tips.length === 0) {
        return (
            <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold text-sm">해당 영역의 팁을 준비 중입니다.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tips.map((tip) => (
                <div key={tip.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                        </div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{tip.category}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm mb-2">{tip.title}</h4>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed" style={{ wordBreak: 'keep-all' }}>
                        {tip.content}
                    </p>
                </div>
            ))}
        </div>
    );
}

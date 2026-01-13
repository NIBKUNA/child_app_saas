import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, MessageCircle, Calendar } from 'lucide-react';

interface Observation {
    id: string;
    content: string;
    observation_date: string;
    created_at: string;
}

export function ParentObservationsList({ childId }: { childId: string }) {
    const [observations, setObservations] = useState<Observation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (childId) fetchObservations();
    }, [childId]);

    const fetchObservations = async () => {
        try {
            const { data, error } = await supabase
                .from('parent_observations')
                .select('*')
                .eq('child_id', childId)
                .order('observation_date', { ascending: false });

            if (error) throw error;
            setObservations(data || []);
        } catch (error) {
            console.error('Failed to fetch observations:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" /></div>;

    if (observations.length === 0) {
        return (
            <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-sm font-bold">등록된 관찰 일기가 없습니다.</p>
                <p className="text-xs text-slate-300 mt-1">학부모님이 작성한 가정 내 관찰 기록이 이곳에 표시됩니다.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {observations.map((obs) => (
                <div key={obs.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-bold">
                        <Calendar className="w-3.5 h-3.5" />
                        {obs.observation_date}
                    </div>
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                            <MessageCircle className="w-4 h-4 text-indigo-500" />
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                            {obs.content}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

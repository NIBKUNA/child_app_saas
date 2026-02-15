import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, MessageCircle, Calendar } from 'lucide-react';

interface Observation {
    id: string;
    content: string;
    observation_date: string | null;
    created_at: string | null;
}

export function ParentObservationsList({ childId }: { childId: string }) {
    const [observations, setObservations] = useState<Observation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (childId) fetchObservations();
    }, [childId]);

    const fetchObservations = async () => {
        try {
            setError(null);
            const { data, error } = await supabase
                .from('parent_observations')
                .select('*')
                .eq('child_id', childId)
                .order('observation_date', { ascending: false });

            if (error) throw error;
            setObservations(data || []);
        } catch (error: any) {
            console.error('Failed to fetch observations:', error);
            setError('관찰 일기를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" /></div>;

    if (error) {
        return (
            <div className="text-center p-6 bg-rose-50 rounded-xl border border-dashed border-rose-200">
                <p className="text-rose-500 text-sm font-bold">{error}</p>
                <button onClick={fetchObservations} className="text-xs text-rose-400 mt-2 underline hover:text-rose-600">다시 시도</button>
            </div>
        );
    }

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

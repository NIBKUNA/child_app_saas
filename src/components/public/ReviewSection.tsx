import { useState, useEffect } from 'react';
import { Star, MessageSquarePlus, Quote } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ReviewModal } from './ReviewModal';
import { Skeleton } from '@/components/common/Skeleton'; // Zero-Delay Optimization

interface Review {
    id: string;
    center_id: string;
    parent_id: string;
    rating: number;
    content: string;
    parent_name?: string;
    created_at: string;
    is_visible: boolean;
}

export function ReviewSection() {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [avgRating, setAvgRating] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('is_visible', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const fetchedReviews = (data as any[]) || [];
            setReviews(fetchedReviews);

            // Calculate Average
            if (fetchedReviews.length > 0) {
                const total = fetchedReviews.reduce((acc: number, curr: any) => acc + curr.rating, 0);
                setAvgRating(total / fetchedReviews.length);
            }
        } catch (err) {
            console.error("Failed to fetch reviews", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-24 relative overflow-hidden transition-colors bg-transparent">


            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 backdrop-blur-sm text-yellow-600 dark:text-yellow-400 text-xs font-black uppercase tracking-widest mb-6 shadow-sm">
                        <Star className="w-4 h-4 fill-yellow-600 dark:fill-yellow-400" />
                        Trusted by Parents
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                        자라다와 함께 성장하는<br />아이들의 이야기
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
                        부모님들이 직접 경험한 자라다의 전문성을 확인해보세요.
                    </p>

                    {/* Summary Card */}
                    <div className="mt-12 p-8 bg-white dark:bg-slate-900/70 backdrop-blur-md rounded-[40px] inline-flex flex-col md:flex-row items-center gap-8 border border-slate-100 dark:border-white/10 shadow-xl dark:shadow-2xl">
                        <div className="text-center md:text-left">
                            <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {loading ? <Skeleton className="w-24 h-12 rounded-xl" /> : avgRating.toFixed(1)}
                            </div>
                            <div className="flex gap-1 mt-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star key={star} className={`w-5 h-5 ${star <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-700'}`} />
                                ))}
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-2 uppercase tracking-wide">Average Rating</p>
                        </div>
                        <div className="w-px h-16 bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
                        <div className="text-center md:text-left">
                            <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {loading ? <Skeleton className="w-24 h-12 rounded-xl" /> : reviews.length}
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-2 uppercase tracking-wide">Total Reviews</p>
                        </div>
                    </div>
                </div>

                {/* Reviews Grid */}
                <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {loading ? (
                        [1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-[32px]" />)
                    ) : reviews.length > 0 ? (
                        reviews.slice(0, 3).map((review) => (
                            <div key={review.id} className="p-8 rounded-[32px] bg-white dark:bg-slate-900/70 backdrop-blur-md border border-slate-100 dark:border-white/10 relative group hover:-translate-y-1 transition-all duration-300 hover:shadow-xl dark:shadow-lg">
                                <Quote className="w-8 h-8 text-indigo-100 dark:text-indigo-500/20 absolute top-8 right-8" />
                                <div className="flex gap-1 mb-6">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 dark:text-slate-700'}`} />
                                    ))}
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed mb-6 line-clamp-4">
                                    "{review.content}"
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm">
                                        {review.parent_name?.[0] || '익'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 dark:text-white">{review.parent_name || '익명 부모님'}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(review.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 text-slate-400 dark:text-slate-500 font-bold bg-white dark:bg-slate-900/40 backdrop-blur-sm rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800">
                            아직 작성된 리뷰가 없습니다. 첫 번째 이야기를 들려주세요!
                        </div>
                    )}
                </div>

                {/* Write Button (Parents Only) */}
                {user && (
                    <div className="text-center mt-16">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black shadow-lg hover:bg-slate-800 dark:hover:bg-slate-200 hover:scale-105 transition-all"
                        >
                            <MessageSquarePlus className="w-5 h-5" />
                            소중한 후기 남기기
                        </button>
                    </div>
                )}
            </div>

            <ReviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchReviews}
                userId={user?.id}
            />
        </section>
    );
}

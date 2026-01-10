// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-10
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 이 파일의 UI/UX 설계 및 데이터 연동 로직은 독자적인 기술과
 * 예술적 영감을 바탕으로 구축되었습니다.
 */
/**
 * ============================================
 * 🎨 ZARADA - Reviews Section Component
 * 지점별 서비스 리뷰 표시 및 작성
 * ============================================
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight, Send, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// 금칙어 목록 (의료광고법 준수)
const BANNED_WORDS = [
    '완치', '치료됨', '효과', '개선', '나았', '호전', '좋아졌', '치유',
    '100%', '확실', '보장', '최고', '유일', '기적', '완벽'
];

// 금칙어 검사 함수
function containsBannedWords(text: string): string[] {
    const found: string[] = [];
    BANNED_WORDS.forEach(word => {
        if (text.includes(word)) found.push(word);
    });
    return found;
}

// 별점 컴포넌트
function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onClick={() => onChange?.(star)}
                    className={`transition-all ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
                >
                    <Star
                        className={`w-5 h-5 ${star <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                    />
                </button>
            ))}
        </div>
    );
}

// 리뷰 카드 컴포넌트
function ReviewCard({ review }: { review: any }) {
    const avgRating = ((review.rating_facility + review.rating_kindness + review.rating_convenience) / 3).toFixed(1);

    return (
        <motion.div
            className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-100 border border-slate-100 relative overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100 }}
        >
            {/* Gradient Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full"></div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-lg font-black text-indigo-600">
                            {review.author_name.charAt(0)}
                        </div>
                        <div>
                            <p className="font-black text-slate-800">{review.author_name}</p>
                            <p className="text-xs text-slate-400 font-medium">
                                {new Date(review.created_at).toLocaleDateString('ko-KR')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="font-black text-amber-600 text-sm">{avgRating}</span>
                    </div>
                </div>

                {/* Ratings Breakdown */}
                <div className="grid grid-cols-3 gap-4 mb-6 bg-slate-50 rounded-2xl p-4">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">시설</p>
                        <div className="flex justify-center">
                            <StarRating value={review.rating_facility} readonly />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">친절도</p>
                        <div className="flex justify-center">
                            <StarRating value={review.rating_kindness} readonly />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">편의성</p>
                        <div className="flex justify-center">
                            <StarRating value={review.rating_convenience} readonly />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// 리뷰 작성 폼 - 별점만 수집 (의료법 준수)
function ReviewForm({ centerId, onSuccess }: { centerId: string; onSuccess: () => void }) {
    const { user } = useAuth();
    const [authorName, setAuthorName] = useState('');
    const [ratings, setRatings] = useState({ facility: 5, kindness: 5, convenience: 5 });
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!authorName.trim()) {
            setError('작성자명을 입력해주세요.');
            return;
        }

        setSubmitting(true);
        try {
            const { error: insertError } = await supabase.from('reviews').insert({
                center_id: centerId,
                author_name: authorName,
                rating_facility: ratings.facility,
                rating_kindness: ratings.kindness,
                rating_convenience: ratings.convenience,
                is_approved: false // 관리자 승인 대기
            });

            if (insertError) throw insertError;

            alert('리뷰가 등록되었습니다. 관리자 승인 후 게시됩니다.');
            setAuthorName('');
            setRatings({ facility: 5, kindness: 5, convenience: 5 });
            onSuccess();
        } catch (err: any) {
            setError(err.message || '리뷰 등록에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.form
            onSubmit={handleSubmit}
            className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-100 border border-slate-100 gpu-accelerate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h4 className="text-lg font-black text-slate-800 mb-2">서비스 평가하기</h4>
            <p className="text-xs text-slate-400 mb-6">시설, 친절도, 편의성에 대한 별점을 남겨주세요.</p>

            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">작성자명</label>
                    <input
                        type="text"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        placeholder="홍길동 어머님"
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                </div>

                {/* 별점만 수집 (의료법 준수) */}
                <div className="grid grid-cols-3 gap-4 bg-slate-50 rounded-2xl p-6">
                    <div className="text-center">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-3">시설</label>
                        <div className="flex justify-center">
                            <StarRating value={ratings.facility} onChange={(v) => setRatings(p => ({ ...p, facility: v }))} />
                        </div>
                    </div>
                    <div className="text-center">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-3">친절도</label>
                        <div className="flex justify-center">
                            <StarRating value={ratings.kindness} onChange={(v) => setRatings(p => ({ ...p, kindness: v }))} />
                        </div>
                    </div>
                    <div className="text-center">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-3">편의성</label>
                        <div className="flex justify-center">
                            <StarRating value={ratings.convenience} onChange={(v) => setRatings(p => ({ ...p, convenience: v }))} />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-3 rounded-2xl">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <p className="text-sm font-bold">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 gpu-accelerate"
                >
                    {submitting ? '등록 중...' : <><Send className="w-4 h-4" /> 평가 등록</>}
                </button>
            </div>
        </motion.form>
    );
}

// 메인 리뷰 섹션 컴포넌트
export function ReviewsSection({ centerId }: { centerId?: string }) {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const fetchReviews = async () => {
        if (!centerId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('center_id', centerId)
                .eq('is_approved', true)
                .order('created_at', { ascending: false });

            if (!error && data) setReviews(data);
        } catch (err) {
            console.error('Failed to fetch reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [centerId]);

    const nextReview = () => {
        if (currentIndex < reviews.length - 1) setCurrentIndex(prev => prev + 1);
    };

    const prevReview = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    if (loading) {
        return (
            <div className="text-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            </div>
        );
    }

    return (
        <section className="py-16">
            <div className="text-center mb-12">
                <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black tracking-wider uppercase mb-4">
                    Reviews
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-[-0.05em]" style={{ wordBreak: 'keep-all' }}>
                    부모님들의 생생한 후기
                </h2>
            </div>

            {reviews.length > 0 ? (
                <div className="relative">
                    <AnimatePresence mode="wait">
                        <ReviewCard key={reviews[currentIndex].id} review={reviews[currentIndex]} />
                    </AnimatePresence>

                    {reviews.length > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                            <button
                                onClick={prevReview}
                                disabled={currentIndex === 0}
                                className="w-12 h-12 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center disabled:opacity-30 hover:bg-slate-50 transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex gap-2">
                                {reviews.slice(0, 5).map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-2 rounded-full transition-all ${currentIndex === idx ? 'w-6 bg-indigo-600' : 'w-2 bg-slate-200'}`}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={nextReview}
                                disabled={currentIndex === reviews.length - 1}
                                className="w-12 h-12 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center disabled:opacity-30 hover:bg-slate-50 transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-slate-50 rounded-[32px] p-12 text-center">
                    <Quote className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">아직 등록된 리뷰가 없습니다.</p>
                </div>
            )}

            <div className="mt-12 text-center">
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-8 py-3 bg-slate-900 text-white font-black rounded-full shadow-lg hover:bg-indigo-600 transition-all"
                >
                    {showForm ? '닫기' : '리뷰 작성하기'}
                </button>
            </div>

            {showForm && centerId && (
                <div className="mt-8">
                    <ReviewForm centerId={centerId} onSuccess={fetchReviews} />
                </div>
            )}
        </section>
    );
}

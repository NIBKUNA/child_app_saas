import { useState } from 'react';
import { X, Star, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { JAMSIL_CENTER_ID } from '@/config/center';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId?: string;
}

export function ReviewModal({ isOpen, onClose, onSuccess, userId }: ReviewModalProps) {
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!content.trim()) return alert('내용을 입력해주세요.');
        if (!userId) return alert('로그인이 필요합니다.');

        setSubmitting(true);
        try {
            const { error } = await (supabase.from('reviews') as any).insert({
                center_id: JAMSIL_CENTER_ID,
                parent_id: userId,
                rating,
                content: content.trim(),
                is_visible: true // Auto-approve for now
            });

            if (error) throw error;

            alert('소중한 후기가 등록되었습니다! 감사합니다.');
            onSuccess();
            onClose();
            setContent('');
            setRating(5);
        } catch (e: any) {
            console.error(e);
            alert('등록 중 오류가 발생했습니다: ' + e.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-10">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">리뷰 작성하기</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">아이와의 소중한 변화를 들려주세요.</p>

                    <div className="space-y-8">
                        <div>
                            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Rating</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className="transition-transform hover:scale-110 active:scale-95 text-3xl"
                                    >
                                        <Star
                                            className={`w-10 h-10 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 dark:text-slate-600'}`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Review Content</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="치료 과정에서 느낌 점이나 아이의 변화에 대해 자유롭게 작성해주세요."
                                className="w-full h-40 p-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[24px] focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/20 focus:border-indigo-200 dark:focus:border-indigo-500 outline-none resize-none font-medium text-slate-700 dark:text-white transition-all placeholder:text-slate-300 dark:placeholder:text-slate-500"
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-slate-800 dark:hover:bg-indigo-500 active:scale-95 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : '작성 완료'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

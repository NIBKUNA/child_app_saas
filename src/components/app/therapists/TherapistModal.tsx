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

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, X } from 'lucide-react';

type TherapistModalProps = {
    isOpen: boolean;
    onClose: (refresh?: boolean) => void;
};

export function TherapistModal({ isOpen, onClose }: TherapistModalProps) {
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [specialization, setSpecialization] = useState('언어치료');
    const [color, setColor] = useState('#3B82F6');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await (supabase
            .from('therapists') as any)
            .insert([
                {
                    name,
                    email: email || null,
                    phone: phone || null,
                    specialization: [specialization], // 배열로 감싸주거나
                    color
                }
            ])

        setLoading(false);

        if (error) {
            alert('등록 실패: ' + error.message);
        } else {
            onClose(true);
            setName('');
            setPhone('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-bold">치료사 등록</h2>
                    <button onClick={() => onClose()} className="p-1 hover:bg-slate-100 rounded">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
                        <input
                            type="text" required
                            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            value={name} onChange={e => setName(e.target.value)}
                            placeholder="치료사 이름"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">연락처</label>
                        <input
                            type="tel"
                            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            value={phone} onChange={e => setPhone(e.target.value)}
                            placeholder="010-0000-0000"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">이메일</label>
                        <input
                            type="email"
                            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="example@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">전문분야</label>
                        <select
                            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            value={specialization} onChange={e => setSpecialization(e.target.value)}
                        >
                            <option value="언어치료">언어치료</option>
                            <option value="놀이치료">놀이치료</option>
                            <option value="감각통합">감각통합</option>
                            <option value="인지학습">인지학습</option>
                            <option value="미술치료">미술치료</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">캘린더 색상</label>
                        <div className="flex gap-2">
                            {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'].map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={() => onClose()}
                            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md flex items-center"
                        >
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            등록
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

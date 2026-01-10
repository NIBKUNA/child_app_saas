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
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Briefcase, ClipboardList, MessageCircle, X } from 'lucide-react'; // 아이콘 추가

export default function Programs() {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        duration: 40,
        price: 0,
        category: 'therapy' // 기본값
    });

    useEffect(() => { fetchPrograms(); }, []);

    const fetchPrograms = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('programs').select('*').order('category', { ascending: true }); // 카테고리끼리 모아보게 정렬
        if (!error) setPrograms(data || []);
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await supabase.from('programs').update(formData).eq('id', editingId);
            } else {
                await supabase.from('programs').insert([formData]);
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({ name: '', duration: 40, price: 0, category: 'therapy' });
            fetchPrograms();
        } catch (error) {
            alert('저장 실패');
        }
    };

    const handleEdit = (p) => {
        setEditingId(p.id);
        setFormData({
            name: p.name,
            duration: p.duration,
            price: p.price,
            category: p.category || 'therapy'
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        await supabase.from('programs').delete().eq('id', id);
        fetchPrograms();
    };

    // ✨ 카테고리별 디자인 설정
    const getCategoryStyle = (cat) => {
        switch (cat) {
            case 'evaluation':
                return { label: '평가', color: 'bg-blue-100 text-blue-600', icon: ClipboardList, badge: 'bg-blue-50 text-blue-600' };
            case 'counseling':
                return { label: '상담', color: 'bg-emerald-100 text-emerald-600', icon: MessageCircle, badge: 'bg-emerald-50 text-emerald-600' };
            default:
                return { label: '수업', color: 'bg-yellow-100 text-yellow-700', icon: Briefcase, badge: 'bg-slate-100 text-slate-600' };
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">프로그램 관리</h1>
                    <p className="text-slate-500 text-sm">치료 수업, 평가, 상담 항목을 설정합니다.</p>
                </div>
                <button onClick={() => { setEditingId(null); setFormData({ name: '', duration: 40, price: 0, category: 'therapy' }); setIsModalOpen(true); }} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors">
                    <Plus className="w-5 h-5" /> 새 프로그램
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {programs.map((p) => {
                    const style = getCategoryStyle(p.category);
                    const Icon = style.icon;
                    return (
                        <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div className={`p-2 rounded-lg ${style.color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEdit(p)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded text-red-400"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <h3 className="font-bold text-lg text-slate-800 mb-1">{p.name}</h3>
                            <div className="flex gap-2 mb-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${style.badge}`}>
                                    {style.label}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-medium text-slate-500 border-t pt-3 mt-1">
                                <span>{p.duration}분</span>
                                <span className="text-slate-900 font-bold">{p.price.toLocaleString()}원</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-black text-slate-800">{editingId ? '프로그램 수정' : '새 프로그램 등록'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">프로그램명</label>
                                <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="예: 부모 상담" />
                            </div>

                            {/* ✨ 유형 선택 기능 추가 (상담 포함) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">유형 (카테고리)</label>
                                <select className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold bg-white focus:ring-2 focus:ring-slate-900/10 outline-none" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option value="therapy">일반 수업 (치료)</option>
                                    <option value="evaluation">평가 (Assessment)</option>
                                    <option value="counseling">상담 (Counseling)</option> {/* ✨ 추가됨 */}
                                </select>
                                <p className="text-[10px] text-slate-400 mt-1 pl-1">
                                    * '평가'는 평가수당으로, '수업/상담'은 수업료로 계산됩니다.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">소요시간(분)</label>
                                    <input type="number" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none" value={formData.duration} onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">가격(원)</label>
                                    <input type="number" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button type="submit" className="w-full py-3.5 bg-slate-900 font-bold text-white rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-[0.98] transition-all">
                                    저장하기
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
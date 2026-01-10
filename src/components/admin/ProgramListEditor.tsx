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
import { Plus, Trash2, Edit2 } from 'lucide-react';
import type { ProgramItem } from '@/hooks/useAdminSettings';
import { PROGRAM_ICONS } from '@/constants/programIcons';

interface ProgramListEditorProps {
    initialList: ProgramItem[];
    onSave: (list: ProgramItem[]) => void;
}

export function ProgramListEditor({ initialList, onSave }: ProgramListEditorProps) {
    const [list, setList] = useState<ProgramItem[]>(initialList);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<ProgramItem>({
        id: '',
        title: '',
        eng: '',
        desc: '',
        targets: [],
        icon_name: 'MessageCircle'
    });
    const [tempTarget, setTempTarget] = useState('');

    const handleAdd = () => {
        setFormData({
            id: crypto.randomUUID(),
            title: '',
            eng: '',
            desc: '',
            targets: [],
            icon_name: 'MessageCircle'
        });
        setEditingId(null);
        setIsEditing(true);
    };

    const handleEdit = (item: ProgramItem) => {
        setFormData({ ...item });
        setEditingId(item.id);
        setIsEditing(true);
    };

    const handleDelete = (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        const newList = list.filter((item: ProgramItem) => item.id !== id);
        setList(newList);
        onSave(newList);
    };

    const handleSaveForm = () => {
        if (!formData.title) return alert('프로그램명을 입력해주세요.');

        let newList;
        if (editingId) {
            newList = list.map((item: ProgramItem) => item.id === editingId ? formData : item);
        } else {
            newList = [...list, formData];
        }

        setList(newList);
        onSave(newList);
        setIsEditing(false);
    };

    const handleAddTarget = () => {
        if (!tempTarget.trim()) return;
        setFormData((prev: ProgramItem) => ({ ...prev, targets: [...prev.targets, tempTarget] }));
        setTempTarget('');
    };

    const removeTarget = (idx: number) => {
        setFormData((prev: ProgramItem) => ({
            ...prev,
            targets: prev.targets.filter((_: string, i: number) => i !== idx)
        }));
    };

    if (isEditing) {
        return (
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                <h3 className="font-bold text-lg mb-6">{editingId ? '프로그램 수정' : '새 프로그램 추가'}</h3>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">프로그램명 (한글)</label>
                            <input
                                className="w-full p-2 border rounded-lg"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="예: 언어치료"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">영문명</label>
                            <input
                                className="w-full p-2 border rounded-lg"
                                value={formData.eng}
                                onChange={(e) => setFormData({ ...formData, eng: e.target.value })}
                                placeholder="예: Speech Therapy"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">아이콘 선택</label>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(PROGRAM_ICONS).map(([name, Icon]) => (
                                <button
                                    key={name}
                                    onClick={() => setFormData({ ...formData, icon_name: name })}
                                    className={`p-3 rounded-lg border transition-all ${formData.icon_name === name ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
                                >
                                    <Icon className="w-6 h-6" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">설명</label>
                        <textarea
                            className="w-full p-2 border rounded-lg h-24 resize-none"
                            value={formData.desc}
                            onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                            placeholder="프로그램에 대한 설명을 입력하세요."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">추천 대상</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                className="flex-1 p-2 border rounded-lg"
                                value={tempTarget}
                                onChange={(e) => setTempTarget(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTarget()}
                                placeholder="예: 발음이 부정확한 아동 (엔터로 추가)"
                            />
                            <button onClick={handleAddTarget} className="bg-slate-200 px-4 rounded-lg font-bold text-slate-600 hover:bg-slate-300">추가</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.targets.map((target: string, idx: number) => (
                                <span key={idx} className="bg-white border px-2 py-1 rounded-md text-sm flex items-center gap-1">
                                    {target}
                                    <button onClick={() => removeTarget(idx)} className="text-red-500 hover:bg-red-50 rounded-full p-0.5"><Trash2 className="w-3 h-3" /></button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">취소</button>
                        <button onClick={handleSaveForm} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800">
                            {editingId ? '수정 완료' : '추가하기'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {list.map((item: ProgramItem) => {
                const Icon = PROGRAM_ICONS[item.icon_name] || PROGRAM_ICONS['MessageCircle'];
                return (
                    <div key={item.id} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 hover:border-primary/50 transition-all group">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 group-hover:text-primary group-hover:bg-primary/5 transition-colors">
                            <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-900">{item.title}</h4>
                            <p className="text-sm text-slate-500">{item.eng}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleEdit(item)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 bg-slate-50 border border-slate-200" title="수정">
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-400 bg-slate-50 border border-slate-200" title="삭제">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                );
            })}

            <button
                onClick={handleAdd}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-all font-bold"
            >
                <Plus className="w-5 h-5" />
                새 프로그램 추가
            </button>
        </div>
    );
}

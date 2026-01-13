import { X, User } from 'lucide-react';
import { ParentObservationsList } from './ParentObservationsList';

interface ChildDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    child: any;
}

export function ChildDetailModal({ isOpen, onClose, child }: ChildDetailModalProps) {
    if (!isOpen || !child) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-xl">
                            <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">{child.name} 아동 상세 정보</h2>
                            <p className="text-xs text-slate-400 font-bold">{child.birth_date} ({child.gender})</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-0 overflow-y-auto flex-1">
                    <div className="p-6 space-y-8">
                        {/* 1. 기본 정보 요약 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <label className="text-xs font-black text-slate-400 mb-1 block">보호자</label>
                                <p className="font-bold text-slate-700">{child.guardian_name || '미등록'}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <label className="text-xs font-black text-slate-400 mb-1 block">연락처</label>
                                <p className="font-bold text-slate-700">{child.contact || '미등록'}</p>
                            </div>
                            <div className="col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <label className="text-xs font-black text-slate-400 mb-1 block">진단명/특이사항</label>
                                <p className="font-bold text-slate-700">{child.diagnosis || '-'}</p>
                            </div>
                        </div>

                        {/* 2. 부모 관찰 일기 (Marketing Lock-in Feature) */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-lg font-black text-slate-900">학부모 관찰 일기</h3>
                                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">공유됨</span>
                            </div>
                            <div className="bg-slate-50/50 rounded-3xl p-4 border border-slate-100">
                                <ParentObservationsList childId={child.id} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

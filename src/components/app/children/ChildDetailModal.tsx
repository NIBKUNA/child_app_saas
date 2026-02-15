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
            <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-xl">
                            <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">{child.name} 아동 상세 정보</h2>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">{child.birth_date} ({child.gender === 'male' ? '남' : child.gender === 'female' ? '여' : child.gender || '-'})</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md rounded-full transition-all">
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-0 overflow-y-auto flex-1">
                    <div className="p-6 space-y-8">
                        {/* 1. 기본 정보 요약 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <label className="text-xs font-black text-slate-400 dark:text-slate-500 mb-1 block">보호자</label>
                                <p className="font-bold text-slate-700 dark:text-slate-200">{child.guardian_name || '미등록'}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <label className="text-xs font-black text-slate-400 dark:text-slate-500 mb-1 block">연락처</label>
                                <p className="font-bold text-slate-700 dark:text-slate-200">{child.contact || '미등록'}</p>
                            </div>
                            <div className="col-span-2 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <label className="text-xs font-black text-slate-400 dark:text-slate-500 mb-1 block">진단명/특이사항</label>
                                <p className="font-bold text-slate-700 dark:text-slate-200">{child.diagnosis || '-'}</p>
                            </div>
                        </div>

                        {/* 2. 부모 관찰 일기 (Marketing Lock-in Feature) */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">학부모 관찰 일기</h3>
                                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold">공유됨</span>
                            </div>
                            <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-3xl p-4 border border-slate-100 dark:border-slate-700">
                                <ParentObservationsList childId={child.id} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

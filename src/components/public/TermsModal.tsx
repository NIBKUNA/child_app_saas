import { X } from 'lucide-react';
import { useAdminSettings } from '@/hooks/useAdminSettings';

export function TermsModal({ isOpen, onClose, type = 'terms' }: { isOpen: boolean; onClose: () => void; type: 'terms' | 'privacy' }) {
    // ✨ [Hook Order Fix] All hooks MUST be called before any early return
    const { getSetting } = useAdminSettings();
    const centerName = getSetting('center_name') || 'Zarada';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white p-8 rounded-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black">{type === 'terms' ? '이용약관' : '개인정보 처리방침'}</h2>
                    <button onClick={onClose}><X className="w-6 h-6" /></button>
                </div>
                <div className="prose prose-sm text-slate-600 leading-relaxed font-medium">
                    {type === 'terms' ? (
                        <>
                            <h3>제1조 (목적)</h3>
                            <p>본 약관은 {centerName}(이하 "센터")가 제공하는 서비스의 이용조건 및 절차, 이용자와 센터의 권리, 의무, 책임사항을 규정함을 목적으로 합니다.</p>
                            <h3>제2조 (약관의 효력)</h3>
                            <p>본 약관은 서비스를 이용하고자 하는 모든 회원에게 적용됩니다.</p>
                            {/* ... more dummy text ... */}
                        </>
                    ) : (
                        <>
                            <h3>1. 개인정보의 수집 및 이용 목적</h3>
                            <p>{centerName}은(는) 회원가입, 상담 예약, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집합니다.</p>
                            <h3>2. 수집하는 개인정보 항목</h3>
                            <p>이름, 전화번호, 이메일, 자녀 정보(이름, 생년월일, 성별 등)</p>
                            {/* ... more dummy text ... */}
                        </>
                    )}
                </div>
                <div className="mt-8 pt-6 border-t">
                    <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl">확인했습니다</button>
                </div>
            </div>
        </div>
    );
}

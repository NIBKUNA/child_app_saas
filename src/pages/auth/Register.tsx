// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, User, Mail, Lock, Hospital, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [centerId, setCenterId] = useState('');
    // ✨ 역할 값을 DB와 일치시킴 (employee -> therapist 또는 staff)
    // 여기서는 치료사(therapist)로 통일하겠습니다.
    const [role, setRole] = useState('parent');
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchCenters() {
            const { data } = await supabase.from('centers').select('id, name');
            if (data) setCenters(data);
        }
        fetchCenters();
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!centerId) return setError('소속 센터를 선택해 주세요.');

        setLoading(true);
        setError(null);

        try {
            // ✨ [핵심 수정] 
            // user_profiles에 직접 insert하지 않고, signUp의 meta_data에 정보를 담아 보냅니다.
            // DB 트리거가 이 정보를 받아서 프로필을 자동으로 생성합니다.
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        role: role,      // 선택한 역할 전달
                        center_id: centerId // 선택한 센터 전달
                    }
                },
            });

            if (authError) throw authError;

            // 🗑️ [삭제됨] 수동 insert 코드는 삭제했습니다. (RLS 에러 원인 제거)

            if (authData.user) {
                alert('회원가입이 완료되었습니다. 로그인해 주세요!');
                navigate('/login');
            }
        } catch (err: any) {
            // 이미 가입된 경우 등 에러 처리
            setError(err.message || '오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
            <div className="w-full max-w-md bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
                <div className="text-center mb-8">
                    <div className="text-4xl mb-4">🏠</div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">서비스 시작하기</h2>
                    <p className="mt-2 text-sm text-slate-500 font-medium text-balance">
                        소속 센터와 역할을 선택하여 가입해 주세요.
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleRegister}>
                    {/* 센터 선택 */}
                    <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 ml-1 flex items-center gap-1">
                            <Hospital className="w-3 h-3" /> 소속 센터
                        </label>
                        <select
                            required
                            value={centerId}
                            onChange={(e) => setCenterId(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        >
                            <option value="">다니시는 센터 선택</option>
                            {centers.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* ✨ 역할 선택 */}
                    <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 ml-1 flex items-center gap-1">
                            <Users className="w-3 h-3" /> 가입 유형
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {/* value를 DB enum값과 맞춤: parent, therapist, admin */}
                            {[
                                { value: 'parent', label: '학부모' },
                                { value: 'therapist', label: '치료사' }, // employee -> therapist
                                { value: 'admin', label: '관리자' }
                            ].map((r) => (
                                <button
                                    key={r.value}
                                    type="button"
                                    onClick={() => setRole(r.value)}
                                    className={cn(
                                        "py-3 rounded-xl text-xs font-black border transition-all",
                                        role === r.value
                                            ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                            : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                                    )}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <InputField label="이름" icon={<User className="w-3 h-3" />} placeholder="성함 입력" value={name} onChange={setName} />
                        <InputField label="이메일" icon={<Mail className="w-3 h-3" />} type="email" placeholder="example@email.com" value={email} onChange={setEmail} />
                        <InputField label="비밀번호" icon={<Lock className="w-3 h-3" />} type="password" placeholder="8자 이상" value={password} onChange={setPassword} />
                    </div>

                    {error && <div className="p-4 bg-red-50 rounded-2xl text-xs font-bold text-red-500 border border-red-100">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : '가입하기'}
                    </button>

                    <div className="text-center mt-4">
                        <Link to="/login" className="text-xs font-bold text-slate-400 hover:text-slate-600">
                            이미 계정이 있으신가요? <span className="text-slate-900 underline">로그인</span>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

function InputField({ label, icon, type = "text", placeholder, value, onChange }: any) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-black text-slate-400 ml-1 flex items-center gap-1">
                {icon} {label}
            </label>
            <input
                required
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all"
            />
        </div>
    );
}
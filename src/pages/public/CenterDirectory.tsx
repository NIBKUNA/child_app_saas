import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, MapPin, ArrowRight } from 'lucide-react';

interface Center {
    id: string;
    name: string;
    slug: string | null;
    address: string | null;
    phone: string | null;
}

export function CenterDirectory() {
    const [centers, setCenters] = useState<Center[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCenters() {
            try {
                const { data, error } = await supabase
                    .from('centers')
                    .select('id, name, slug, address, phone')
                    .eq('is_active', true)
                    .order('name');

                if (error) throw error;
                setCenters(data || []);
            } catch (err) {
                console.error('Failed to load centers', err);
            } finally {
                setLoading(false);
            }
        }
        fetchCenters();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 py-20 px-4 md:px-8">
            <Helmet>
                <title>전체 센터 찾기 - 자라다(Zarada)</title>
                <meta name="description" content="전국의 자라다 아동발달센터 지점 정보를 확인하세요. 언어치료, 감각통합, 놀이치료 전문 센터 찾기." />
                <link rel="canonical" href="https://app.myparents.co.kr/centers" />
            </Helmet>

            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">우리 동네 자라다 센터 찾기</h1>
                    <p className="text-slate-500 text-lg">전국 {centers.length}개의 자라다 센터가 아이들과 함께하고 있습니다.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {centers.map(center => {
                            const region = center.address ? center.address.split(' ')[1] : '';
                            return (
                                <Link
                                    key={center.id}
                                    to={`/centers/${center.slug || center.id}`}
                                    className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[200px]"
                                >
                                    <div>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <MapPin size={20} />
                                            </div>
                                            {region && (
                                                <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-md">
                                                    {region}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                            {center.name}
                                        </h3>
                                        <p className="text-sm text-slate-500 line-clamp-2">
                                            {center.address || '주소 정보 없음'}
                                        </p>
                                    </div>
                                    <div className="flex items-center text-sm font-bold text-slate-400 group-hover:text-indigo-600 transition-colors mt-4">
                                        홈페이지 방문하기 <ArrowRight className="w-4 h-4 ml-1" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CenterDirectory;

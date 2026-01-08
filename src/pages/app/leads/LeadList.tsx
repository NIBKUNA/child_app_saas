import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import { Loader2, Phone, Trash2 } from 'lucide-react';

type Lead = Database['public']['Tables']['leads']['Row'];

export function LeadList() {
    const [loading, setLoading] = useState(true);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        let query = (supabase
            .from('leads') as any)
            .select('*')
            .order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching leads:', error);
        } else {
            setLeads(data || []);
        }
        setLoading(false);
    };

    const handleStatusChange = async (id: string, newStatus: Lead['status']) => {
        const { error } = await (supabase
            .from('leads') as any)
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            alert('Status update failed: ' + error.message);
        } else {
            // Optimistic update
            setLeads(leads.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead));
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('정말 이 상담 문의를 삭제하시겠습니까?')) {
            return;
        }

        const { error } = await (supabase
            .from('leads') as any)
            .delete()
            .eq('id', id);

        if (error) {
            alert('삭제 중 오류가 발생했습니다: ' + error.message);
        } else {
            fetchLeads();
        }
    };

    const filteredLeads = filter === 'all'
        ? leads
        : leads.filter(lead => lead.status === filter);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">상담 문의 관리</h1>
                <div className="flex gap-2">
                    <select
                        className="rounded-md border border-input px-3 py-1 text-sm bg-white"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">전체 보기</option>
                        <option value="new">신규 (New)</option>
                        <option value="contacted">연락됨 (Contacted)</option>
                        <option value="scheduled">예약됨 (Scheduled)</option>
                        <option value="converted">등록 완료 (Converted)</option>
                        <option value="cancelled">취소됨 (Cancelled)</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-slate-50 font-medium grid grid-cols-12 gap-4 text-sm text-slate-500">
                    <div className="col-span-2">신청일</div>
                    <div className="col-span-2">보호자 / 연락처</div>
                    <div className="col-span-2">아동 정보</div>
                    <div className="col-span-3">문의 내용 / 서비스</div>
                    <div className="col-span-2">상태</div>
                    <div className="col-span-1 text-center">관리</div>
                </div>

                <div className="divide-y">
                    {filteredLeads.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            문의 내역이 없습니다.
                        </div>
                    ) : (
                        filteredLeads.map((lead) => (
                            <div key={lead.id} className="p-4 grid grid-cols-12 gap-4 items-center text-sm hover:bg-slate-50 transition-colors">
                                <div className="col-span-2 text-slate-500 text-xs">
                                    {new Date(lead.created_at).toLocaleDateString()} <br />
                                    {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="col-span-2">
                                    <div className="font-medium text-slate-900">{lead.parent_name}</div>
                                    <div className="text-xs text-slate-500 flex items-center mt-1">
                                        <Phone className="w-3 h-3 mr-1" /> {lead.phone}
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <div className="font-medium">{lead.child_name || '미입력'}</div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {lead.child_birth_year ? `${lead.child_birth_year}년생` : ''}
                                        {lead.child_gender === 'male' ? '(남)' : lead.child_gender === 'female' ? '(여)' : ''}
                                    </div>
                                </div>
                                <div className="col-span-3">
                                    <div className="flex flex-wrap gap-1 mb-1">
                                        {lead.preferred_service?.map((service, i) => (
                                            <span key={i} className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-medium border border-indigo-100">
                                                {service}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="text-xs text-slate-600 truncate" title={lead.concern || ''}>
                                        {lead.concern || '내용 없음'}
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <select
                                        className={`w-full rounded border px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary ${lead.status === 'new' ? 'bg-red-50 text-red-700 border-red-200' :
                                            lead.status === 'contacted' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                lead.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    lead.status === 'converted' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}
                                        value={lead.status}
                                        onChange={(e) => handleStatusChange(lead.id, e.target.value as any)}
                                    >
                                        <option value="new">신규 접수</option>
                                        <option value="contacted">연락 완료</option>
                                        <option value="scheduled">상담 예약</option>
                                        <option value="converted">등록 완료</option>
                                        <option value="cancelled">취소/보류</option>
                                    </select>
                                </div>
                                <div className="col-span-1 flex justify-center items-center gap-2">
                                    {/* New Indicator */}
                                    {lead.status === 'new' && (
                                        <div className="w-2 h-2 rounded-full bg-red-500" title="New Inquiry"></div>
                                    )}
                                    <button
                                        onClick={() => handleDelete(lead.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                        title="삭제"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

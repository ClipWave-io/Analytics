'use client';

import { useState } from 'react';
import { ChartCard } from '@/app/components/ChartCard';
import { LoadingState, ErrorState } from '@/app/components/PageHeader';
import { Search, User, Zap, CreditCard, MessageSquare, Eye } from 'lucide-react';

export default function JourneyPage() {
  const [email, setEmail] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/analytics/journey?email=${encodeURIComponent(email)}`);
      if (!res.ok) { setError('User not found'); setData(null); return; }
      setData(await res.json());
    } catch { setError('Search failed'); } finally { setLoading(false); }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">User Journey</h1>
        <p className="text-sm text-[#9b9bb0] mt-1">Complete activity timeline for a user</p>
      </div>

      <div className="flex gap-2 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9b9bb0]" />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Search by email..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-[#9b9bb0]/50 focus:outline-none focus:border-[#3388ff]/50 transition-colors"
          />
        </div>
        <button onClick={search} disabled={loading} className="px-6 py-3 rounded-xl bg-[#3388ff] text-white text-sm font-semibold hover:bg-[#2266dd] disabled:opacity-50 transition-colors">
          Search
        </button>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {data && (
        <>
          {/* User profile */}
          <div className="card mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#3388ff]/10 flex items-center justify-center">
                <User className="w-6 h-6 text-[#3388ff]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{data.user.name || data.user.email}</h3>
                <p className="text-sm text-[#9b9bb0]">{data.user.email}</p>
              </div>
              <div className="text-right text-sm">
                <p><span className="text-[#9b9bb0]">Plan:</span> <span className="font-semibold">{data.user.plan || 'free'}</span></p>
                <p><span className="text-[#9b9bb0]">Credits:</span> <span className="font-semibold">{(data.user.credits_remaining ?? 0).toLocaleString()}</span></p>
                <p><span className="text-[#9b9bb0]">Joined:</span> <span className="font-semibold">{new Date(data.user.created_at).toLocaleDateString()}</span></p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title={`Pipeline Runs (${data.runs?.length || 0})`}>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.runs?.map((r: any) => (
                  <div key={r.run_id} className="flex items-center gap-3 px-3 py-2 bg-white/[0.02] rounded-lg text-xs">
                    <Zap className="w-3.5 h-3.5 text-[#3388ff]" />
                    <span className="flex-1 truncate">{r.product_name || r.run_id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.status === 'completed' || r.status === 'done' ? 'bg-[#22c55e]/10 text-[#22c55e]' : r.status === 'error' || r.status === 'failed' ? 'bg-[#ef4444]/10 text-[#ef4444]' : 'bg-white/[0.06] text-[#9b9bb0]'}`}>{r.status}</span>
                    <span className="text-[#9b9bb0]">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
                {!data.runs?.length && <p className="text-sm text-[#9b9bb0] text-center py-4">No runs</p>}
              </div>
            </ChartCard>

            <ChartCard title={`Transactions (${data.transactions?.length || 0})`}>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.transactions?.map((t: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 bg-white/[0.02] rounded-lg text-xs">
                    <CreditCard className="w-3.5 h-3.5 text-[#f59e0b]" />
                    <span className="flex-1 truncate">{t.description || t.type}</span>
                    <span className={`font-semibold ${t.amount < 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>{t.amount > 0 ? '+' : ''}{t.amount}</span>
                    <span className="text-[#9b9bb0]">{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
                {!data.transactions?.length && <p className="text-sm text-[#9b9bb0] text-center py-4">No transactions</p>}
              </div>
            </ChartCard>

            {data.feedback?.length > 0 && (
              <ChartCard title={`Feedback (${data.feedback.length})`}>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {data.feedback.map((f: any, i: number) => (
                    <div key={i} className="px-3 py-2 bg-white/[0.02] rounded-lg text-xs">
                      <p className="text-[#9b9bb0]">{f.message}</p>
                      <p className="text-[#9b9bb0]/50 mt-1">{new Date(f.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </ChartCard>
            )}

            <ChartCard title={`Analytics Events (${data.events?.length || 0})`}>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.events?.map((e: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 bg-white/[0.02] rounded-lg text-xs">
                    <Eye className="w-3.5 h-3.5 text-[#8b5cf6]" />
                    <span className="font-mono">{e.event}</span>
                    <span className="flex-1 text-[#9b9bb0] truncate">{e.source || '-'}</span>
                    <span className="text-[#9b9bb0]">{new Date(e.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
                {!data.events?.length && <p className="text-sm text-[#9b9bb0] text-center py-4">No events</p>}
              </div>
            </ChartCard>
          </div>
        </>
      )}
    </>
  );
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Eye, Cpu, LogOut, Globe } from 'lucide-react';

const RANGES = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'all', label: 'All time' },
] as const;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c0e1a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#9b9bb0] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-white font-semibold">{p.name}: {p.value?.toLocaleString()}</p>
      ))}
    </div>
  );
};

export default function PartnerGilamPage() {
  const router = useRouter();
  const [range, setRange] = useState<string>('30d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (r: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/partner/analytics?range=${r}`);
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error('Failed to fetch');
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#050510] text-white">
      <div className="max-w-[900px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
              <path d="M6 34 Q14 34 19 28 Q24 22 27 18 Q30 14 32 30 Q34 44 38 40 Q42 36 48 34 Q54 32 58 34" stroke="#3388ff" strokeWidth="5" strokeLinecap="round" fill="none" />
            </svg>
            <div>
              <h1 className="text-xl font-bold">Partner Dashboard</h1>
              <p className="text-xs text-[#9b9bb0]">Gilam &mdash; Referral Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1">
              {RANGES.map(r => (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${range === r.key ? 'bg-white/[0.08] text-white' : 'text-[#9b9bb0] hover:text-white'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button onClick={handleLogout} className="p-2 rounded-lg text-[#9b9bb0] hover:text-white hover:bg-white/[0.06] transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading && !data ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-6 h-6 border-2 border-[#3388ff] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] p-6 group hover:border-white/[0.12] transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[#9b9bb0] text-xs font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
                    Unique Visitors
                  </p>
                  <Eye className="w-4 h-4 text-[#9b9bb0] opacity-50" />
                </div>
                <p className="text-3xl font-bold">{data.uniqueVisitors.toLocaleString()}</p>
                <p className="text-xs text-[#9b9bb0] mt-1">Distinct users from your referral link</p>
              </div>
              <div className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] p-6 group hover:border-white/[0.12] transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[#9b9bb0] text-xs font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                    GPT Prefills
                  </p>
                  <Cpu className="w-4 h-4 text-[#9b9bb0] opacity-50" />
                </div>
                <p className="text-3xl font-bold">{data.gptPrefills.toLocaleString()}</p>
                <p className="text-xs text-[#9b9bb0] mt-1">Projects generated via GPT integration</p>
              </div>
            </div>

            {/* Source of Traffic */}
            {data.bySource?.length > 0 && (
              <div className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-4 h-4 text-[#9b9bb0]" />
                  <h3 className="text-sm font-semibold">Source of Traffic</h3>
                </div>
                <div className="space-y-3">
                  {data.bySource.map((s: any) => {
                    const maxIps = Math.max(...data.bySource.map((x: any) => x.unique_ips));
                    return (
                      <div key={s.source} className="flex items-center gap-4">
                        <div className="w-32 text-sm font-medium truncate">{s.source}</div>
                        <div className="flex-1 relative h-8 bg-white/[0.03] rounded-lg overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded-lg bg-[#3388ff]/20"
                            style={{ width: `${(s.unique_ips / maxIps) * 100}%` }}
                          />
                          <div className="absolute inset-0 flex items-center px-3 text-xs">
                            <span className="text-white font-semibold">{s.unique_ips.toLocaleString()} unique visitors</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] p-6">
                <h3 className="text-sm font-semibold mb-4">Daily Unique Visitors</h3>
                {data.byDay?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={data.byDay}>
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9b9bb0' }} tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 10, fill: '#9b9bb0' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="visitors" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} name="Visitors" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-[#9b9bb0] text-center py-16">No data for this period</p>}
              </div>
              <div className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] p-6">
                <h3 className="text-sm font-semibold mb-4">Daily GPT Prefills</h3>
                {data.byDay?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.byDay}>
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9b9bb0' }} tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 10, fill: '#9b9bb0' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="gpt" fill="#f59e0b" radius={[4, 4, 0, 0]} name="GPT Prefills" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-[#9b9bb0] text-center py-16">No data for this period</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

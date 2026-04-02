'use client';

import { useState, useCallback, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Eye, MousePointerClick, Users, CreditCard, Cpu, LogOut } from 'lucide-react';

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

function eventLabel(event: string) {
  switch (event) {
    case 'link_click': return 'Link Click';
    case 'gpt_prefill': return 'GPT Prefill';
    case 'gpt_seedance_prefill': return 'GPT Studio Prefill';
    default: return event;
  }
}

export default function PartnerGilamPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [range, setRange] = useState<string>('30d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (r: string, t: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/partner/analytics?range=${r}&partner=gilam`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch(`/api/partner/analytics?range=${range}&partner=gilam`, {
      headers: { Authorization: `Bearer ${password}` },
    });
    if (res.ok) {
      setToken(password);
      setAuthed(true);
      setData(await res.json());
    } else {
      setError('Invalid password');
    }
  };

  useEffect(() => {
    if (authed && token) fetchData(range, token);
  }, [range, authed, token, fetchData]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <div className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] p-8">
            <div className="flex items-center gap-3 mb-6">
              <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
                <path d="M6 34 Q14 34 19 28 Q24 22 27 18 Q30 14 32 30 Q34 44 38 40 Q42 36 48 34 Q54 32 58 34" stroke="#3388ff" strokeWidth="5" strokeLinecap="round" fill="none" />
              </svg>
              <div>
                <h1 className="text-lg font-bold text-white">Clipwave</h1>
                <p className="text-xs text-[#9b9bb0]">Partner Dashboard</p>
              </div>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter partner password"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-[#9b9bb0]/50 focus:outline-none focus:border-[#3388ff]/50 mb-4"
            />
            {error && <p className="text-xs text-[#ef4444] mb-3">{error}</p>}
            <button type="submit" className="w-full py-3 rounded-xl bg-[#3388ff] text-white text-sm font-semibold hover:bg-[#2266dd] transition-colors">
              Access Dashboard
            </button>
          </div>
        </form>
      </div>
    );
  }

  const conversionRate = data?.clicks > 0 ? ((data.registrations / data.clicks) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-[#050510] text-white">
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
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
            <button onClick={() => { setAuthed(false); setToken(''); setData(null); }} className="p-2 rounded-lg text-[#9b9bb0] hover:text-white hover:bg-white/[0.06] transition-colors">
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <KPICard icon={<MousePointerClick className="w-4 h-4" />} label="Link Clicks" value={data.clicks} color="#3388ff" />
              <KPICard icon={<Eye className="w-4 h-4" />} label="Unique Visitors" value={data.uniqueVisitors} color="#8b5cf6" />
              <KPICard icon={<Cpu className="w-4 h-4" />} label="GPT Prefills" value={data.gptPrefills} color="#f59e0b" />
              <KPICard icon={<Users className="w-4 h-4" />} label="Registrations" value={data.registrations} subtext={`${conversionRate}% conv.`} color="#22c55e" />
              <KPICard icon={<CreditCard className="w-4 h-4" />} label="Paid Conversions" value={data.paidConversions} color="#ef4444" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] p-6">
                <h3 className="text-sm font-semibold mb-4">Daily Clicks</h3>
                {data.byDay?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={data.byDay}>
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9b9bb0' }} tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 10, fill: '#9b9bb0' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="clicks" stroke="#3388ff" fill="#3388ff" fillOpacity={0.1} name="Clicks" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-[#9b9bb0] text-center py-16">No data for this period</p>}
              </div>
              <div className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] p-6">
                <h3 className="text-sm font-semibold mb-4">Daily Activity</h3>
                {data.byDay?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.byDay}>
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9b9bb0' }} tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 10, fill: '#9b9bb0' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="clicks" fill="#3388ff" radius={[4, 4, 0, 0]} name="Clicks" />
                      <Bar dataKey="gpt" fill="#f59e0b" radius={[4, 4, 0, 0]} name="GPT Prefills" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-[#9b9bb0] text-center py-16">No data for this period</p>}
              </div>
            </div>

            {/* Source breakdown */}
            {data.bySource?.length > 0 && (
              <div className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] p-6 mb-8">
                <h3 className="text-sm font-semibold mb-4">By Source</h3>
                <div className="flex flex-wrap gap-3">
                  {data.bySource.map((s: any) => (
                    <div key={s.source} className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                      <span className="text-sm font-mono">{s.source}</span>
                      <span className="text-sm font-bold text-[#3388ff]">{s.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Events */}
            <div className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] p-6">
              <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
              <div className="overflow-auto max-h-[500px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#0a0a1a] z-10">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#9b9bb0] uppercase tracking-wider">Time</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#9b9bb0] uppercase tracking-wider">Type</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#9b9bb0] uppercase tracking-wider">Source</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#9b9bb0] uppercase tracking-wider">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentEvents?.map((e: any, i: number) => (
                      <tr key={i} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 text-xs text-[#9b9bb0]">{new Date(e.created_at).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            e.event === 'link_click' ? 'bg-[#3388ff]/10 text-[#3388ff]' :
                            'bg-[#f59e0b]/10 text-[#f59e0b]'
                          }`}>
                            {eventLabel(e.event)}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">{e.source}</td>
                        <td className="py-3 px-4 font-mono text-xs text-[#9b9bb0]">{e.ip || '—'}</td>
                      </tr>
                    ))}
                    {(!data.recentEvents || data.recentEvents.length === 0) && (
                      <tr><td colSpan={4} className="py-8 text-center text-[#9b9bb0]">No events in this period</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {data.recentEvents?.length > 0 && (
                <p className="text-xs text-[#9b9bb0] mt-2">{data.recentEvents.length} events shown (max 100)</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, subtext, color }: { icon: React.ReactNode; label: string; value: number; subtext?: string; color: string }) {
  return (
    <div className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] p-5 group hover:border-white/[0.12] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[#9b9bb0] text-xs font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          {label}
        </p>
        <span className="text-[#9b9bb0] opacity-50">{icon}</span>
      </div>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      {subtext && <p className="text-xs text-[#9b9bb0] mt-1">{subtext}</p>}
    </div>
  );
}

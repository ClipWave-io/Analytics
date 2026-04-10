'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { notFound } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { Eye, Cpu, Globe } from 'lucide-react';
import { KPICard } from '@/app/components/KPICard';
import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { useDateRange } from '@/app/hooks/useAnalytics';

const PARTNERS: Record<string, { name: string; color: string }> = {
  gilam: { name: 'Gilam', color: '#8b5cf6' },
};

interface PartnerData {
  uniqueVisitors: number;
  gptPrefills: number;
  byDay: Array<{ day: string; visitors: number; gpt: number }>;
  bySource: Array<{ source: string; unique_ips: number }>;
  visitors: Array<{ ip: string; source: string; visited_at: string; country: string }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c0e1a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#9b9bb0] mb-1">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any) => (
        <p key={p.name} className="text-white font-semibold">{p.name}: {p.value?.toLocaleString()}</p>
      ))}
    </div>
  );
};

export default function PartnerDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const meta = PARTNERS[slug];
  if (!meta) notFound();

  const { range, setRange, compare, setCompare } = useDateRange();
  const [data, setData] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ partner: slug, from: range.from, to: range.to });
      const res = await fetch(`/api/partner/analytics?${params}`);
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [slug, range.from, range.to]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (error) return <><PageHeader title={`Partner · ${meta.name}`} range={range} onRangeChange={setRange} /><ErrorState message={error} onRetry={fetchData} /></>;

  return (
    <>
      <PageHeader
        title={`Partner · ${meta.name}`}
        subtitle="Referral analytics — admin view of partner dashboard"
        range={range}
        onRangeChange={setRange}
        compare={compare}
        onCompareChange={setCompare}
        onRefresh={fetchData}
        loading={loading}
      />

      {loading && !data ? <LoadingState /> : data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KPICard
              title="Unique Visitors"
              value={data.uniqueVisitors}
              icon={<Eye className="w-5 h-5" />}
              color={meta.color}
            />
            <KPICard
              title="GPT Prefills"
              value={data.gptPrefills}
              icon={<Cpu className="w-5 h-5" />}
              color="#f59e0b"
            />
            <KPICard
              title="Sources"
              value={data.bySource?.length || 0}
              icon={<Globe className="w-5 h-5" />}
              color="#3388ff"
            />
            <KPICard
              title="Conversion"
              value={data.uniqueVisitors > 0 ? `${((data.gptPrefills / data.uniqueVisitors) * 100).toFixed(1)}%` : '—'}
              color="#22c55e"
            />
          </div>

          {data.bySource?.length > 0 && (
            <div className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-[#9b9bb0]" />
                <h3 className="text-sm font-semibold">Source of Traffic</h3>
              </div>
              <div className="space-y-3">
                {data.bySource.map((s) => {
                  const maxIps = Math.max(...data.bySource.map((x) => x.unique_ips));
                  return (
                    <div key={s.source} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium truncate">{s.source}</div>
                      <div className="flex-1 relative h-8 bg-white/[0.03] rounded-lg overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-lg"
                          style={{
                            width: `${(s.unique_ips / maxIps) * 100}%`,
                            backgroundColor: `${meta.color}30`,
                          }}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] p-6">
              <h3 className="text-sm font-semibold mb-4">Daily Unique Visitors</h3>
              {data.byDay?.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={data.byDay}>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9b9bb0' }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: '#9b9bb0' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="visitors" stroke={meta.color} fill={meta.color} fillOpacity={0.15} name="Visitors" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-[#9b9bb0] text-center py-16">No data for this period</p>}
            </div>
            <div className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] p-6">
              <h3 className="text-sm font-semibold mb-4">Daily GPT Prefills</h3>
              {data.byDay?.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.byDay}>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9b9bb0' }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: '#9b9bb0' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="gpt" fill="#f59e0b" radius={[4, 4, 0, 0]} name="GPT Prefills" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-[#9b9bb0] text-center py-16">No data for this period</p>}
            </div>
          </div>

          {data.visitors?.length > 0 && (
            <div className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] p-6">
              <h3 className="text-sm font-semibold mb-4">Unique Visitor Log</h3>
              <div className="max-h-[500px] overflow-y-auto rounded-xl">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[#0a0a1a]">
                    <tr className="text-[#9b9bb0] border-b border-white/[0.06]">
                      <th className="text-left py-2 px-3 font-medium">Date</th>
                      <th className="text-left py-2 px-3 font-medium">IP</th>
                      <th className="text-left py-2 px-3 font-medium">Country</th>
                      <th className="text-left py-2 px-3 font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.visitors.map((v, i) => (
                      <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="py-2 px-3 text-[#9b9bb0]">{v.visited_at?.slice(0, 16).replace('T', ' ')}</td>
                        <td className="py-2 px-3 font-mono">{v.ip}</td>
                        <td className="py-2 px-3">{v.country}</td>
                        <td className="py-2 px-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                            style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                          >
                            {v.source}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

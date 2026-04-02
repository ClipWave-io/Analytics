'use client';

import { KPICard } from '@/app/components/KPICard';
import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { ChartCard } from '@/app/components/ChartCard';
import { useDateRange, useAnalytics } from '@/app/hooks/useAnalytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpDown } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c0e1a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#9b9bb0] mb-1">{label}</p>
      {payload.map((p: any) => <p key={p.name} className="text-white font-semibold">{p.name}: {p.value?.toLocaleString()}</p>)}
    </div>
  );
};

export default function ExpansionPage() {
  const { range, setRange } = useDateRange();
  const { data, loading, error, refresh } = useAnalytics<any>('expansion', range);

  const totalTopups = data?.topupsByDay?.reduce((s: number, r: any) => s + r.count, 0) || 0;
  const totalCredits = data?.topupsByDay?.reduce((s: number, r: any) => s + r.credits, 0) || 0;

  if (error) return <><PageHeader title="Expansion Revenue" range={range} onRangeChange={setRange} /><ErrorState message={error} onRetry={refresh} /></>;

  return (
    <>
      <PageHeader title="Expansion Revenue" subtitle="Top-ups and upgrade activity" range={range} onRangeChange={setRange} onRefresh={refresh} loading={loading} />

      {loading && !data ? <LoadingState /> : data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <KPICard title="Top-ups (period)" value={totalTopups} icon={<ArrowUpDown className="w-5 h-5" />} color="#3388ff" />
            <KPICard title="Credits Purchased" value={totalCredits.toLocaleString()} color="#22c55e" />
          </div>

          <ChartCard title="Top-up Activity by Day">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topupsByDay}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9b9bb0' }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#9b9bb0' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#3388ff" radius={[4, 4, 0, 0]} name="Top-ups" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </>
  );
}

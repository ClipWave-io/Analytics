'use client';

import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { ChartCard } from '@/app/components/ChartCard';
import { useDateRange, useAnalytics } from '@/app/hooks/useAnalytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const FEATURE_COLORS = ['#3388ff', '#8b5cf6', '#22c55e', '#f59e0b'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c0e1a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#9b9bb0] mb-1">{label}</p>
      {payload.map((p: any) => <p key={p.name} className="text-white font-semibold">{p.value} users</p>)}
    </div>
  );
};

export default function FeaturesPage() {
  const { range, setRange } = useDateRange();
  const { data, loading, error, refresh } = useAnalytics<any>('features', range);

  if (error) return <><PageHeader title="Feature Adoption" range={range} onRangeChange={setRange} /><ErrorState message={error} onRetry={refresh} /></>;

  return (
    <>
      <PageHeader title="Feature Adoption" subtitle="Which features users engage with" range={range} onRangeChange={setRange} onRefresh={refresh} loading={loading} />

      {loading && !data ? <LoadingState /> : data && (
        <>
          <ChartCard title="Active Users by Feature" className="mb-8">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.features}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9b9bb0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9b9bb0' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="users" name="Users" radius={[4, 4, 0, 0]}>
                  {data.features?.map((_: any, i: number) => <Cell key={i} fill={FEATURE_COLORS[i % FEATURE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.features?.map((f: any, i: number) => (
              <div key={f.name} className="card">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: FEATURE_COLORS[i % FEATURE_COLORS.length] }} />
                  <span className="text-sm font-semibold">{f.name}</span>
                </div>
                <p className="text-2xl font-bold">{f.users}</p>
                <p className="text-xs text-[#9b9bb0] mt-1">{f.pct}% of active users</p>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

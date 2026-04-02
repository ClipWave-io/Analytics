'use client';

import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { ChartCard } from '@/app/components/ChartCard';
import { useDateRange, useAnalytics } from '@/app/hooks/useAnalytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c0e1a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#9b9bb0] mb-1">{label}</p>
      {payload.map((p: any) => <p key={p.name} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value?.toLocaleString()}</p>)}
    </div>
  );
};

export default function ReturningPage() {
  const { range, setRange } = useDateRange();
  const { data, loading, error, refresh } = useAnalytics<any>('returning', range);

  if (error) return <><PageHeader title="New vs Returning" range={range} onRangeChange={setRange} /><ErrorState message={error} onRetry={refresh} /></>;

  return (
    <>
      <PageHeader title="New vs Returning Users" subtitle="Daily breakdown of new and returning visitors" range={range} onRangeChange={setRange} onRefresh={refresh} loading={loading} />

      {loading && !data ? <LoadingState /> : data && (
        <ChartCard title="Daily New vs Returning">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.daily}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9b9bb0' }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#9b9bb0' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="new_users" stackId="a" fill="#3388ff" name="New" radius={[0, 0, 0, 0]} />
              <Bar dataKey="returning_users" stackId="a" fill="#22c55e" name="Returning" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </>
  );
}

'use client';

import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { ChartCard } from '@/app/components/ChartCard';
import { DataTable } from '@/app/components/DataTable';
import { useDateRange, useAnalytics } from '@/app/hooks/useAnalytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c0e1a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#9b9bb0] mb-1">{label}</p>
      {payload.map((p: any) => <p key={p.name} className="text-white font-semibold">{p.name}: {p.value?.toLocaleString()}</p>)}
    </div>
  );
};

export default function PagesPage() {
  const { range, setRange } = useDateRange();
  const { data, loading, error, refresh } = useAnalytics<any>('pages', range);

  const top = data?.pages?.slice(0, 15) || [];

  if (error) return <><PageHeader title="Top Pages" range={range} onRangeChange={setRange} /><ErrorState message={error} onRetry={refresh} /></>;

  return (
    <>
      <PageHeader title="Top Landing Pages" subtitle="Most visited paths" range={range} onRangeChange={setRange} onRefresh={refresh} loading={loading} />

      {loading && !data ? <LoadingState /> : data && (
        <>
          <ChartCard title="Top Pages" className="mb-8">
            <ResponsiveContainer width="100%" height={Math.max(250, top.length * 35)}>
              <BarChart data={top} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9b9bb0' }} />
                <YAxis type="category" dataKey="path" tick={{ fontSize: 10, fill: '#9b9bb0' }} width={200} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="visits" fill="#3388ff" radius={[0, 4, 4, 0]} name="Visits" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="All Pages">
            <DataTable
              columns={[
                { key: 'path', label: 'Path', render: (v: string) => <span className="font-mono text-xs">{v}</span> },
                { key: 'visits', label: 'Visits', align: 'right', render: (v: number) => v.toLocaleString() },
                { key: 'unique_visitors', label: 'Unique IPs', align: 'right', render: (v: number) => v.toLocaleString() },
              ]}
              data={data.pages || []}
              exportFilename="top-pages"
            />
          </ChartCard>
        </>
      )}
    </>
  );
}

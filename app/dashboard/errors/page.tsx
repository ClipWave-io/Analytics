'use client';

import { KPICard } from '@/app/components/KPICard';
import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { ChartCard } from '@/app/components/ChartCard';
import { DataTable } from '@/app/components/DataTable';
import { useDateRange, useAnalytics } from '@/app/hooks/useAnalytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c0e1a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#9b9bb0] mb-1">{label}</p>
      {payload.map((p: any) => <p key={p.name} className="text-white font-semibold">{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function ErrorsPage() {
  const { range, setRange } = useDateRange();
  const { data, loading, error, refresh } = useAnalytics<any>('errors', range);

  const totalFailures = data?.dailyFailures?.reduce((s: number, r: any) => s + r.count, 0) || 0;

  if (error) return <><PageHeader title="Error Tracking" range={range} onRangeChange={setRange} /><ErrorState message={error} onRetry={refresh} /></>;

  return (
    <>
      <PageHeader title="Error & Failure Tracking" subtitle="Pipeline failures and error rates" range={range} onRangeChange={setRange} onRefresh={refresh} loading={loading} />

      {loading && !data ? <LoadingState /> : data && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <KPICard title="Total Failures" value={totalFailures} icon={<AlertTriangle className="w-5 h-5" />} color="#ef4444" />
            <KPICard title="Failed Runs Listed" value={data.failedRuns?.length || 0} color="#f59e0b" />
          </div>

          <ChartCard title="Daily Failures" className="mb-8">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.dailyFailures}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9b9bb0' }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#9b9bb0' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failures" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Recent Failed Runs">
            <DataTable
              columns={[
                { key: 'email', label: 'User' },
                { key: 'product_name', label: 'Product' },
                { key: 'status', label: 'Status', render: (v: string) => <span className="text-[#ef4444] font-semibold">{v}</span> },
                { key: 'created_at', label: 'Date', render: (v: string) => v ? new Date(v).toLocaleString() : '-' },
              ]}
              data={data.failedRuns || []}
              exportFilename="failed-runs"
            />
          </ChartCard>
        </>
      )}
    </>
  );
}

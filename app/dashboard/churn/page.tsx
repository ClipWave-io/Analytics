'use client';

import { KPICard } from '@/app/components/KPICard';
import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { ChartCard } from '@/app/components/ChartCard';
import { useDateRange, useAnalytics } from '@/app/hooks/useAnalytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown, AlertTriangle } from 'lucide-react';

const PLAN_COLORS: Record<string, string> = { starter: '#3388ff', pro: '#8b5cf6', agency: '#f59e0b', free: '#6b7280' };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c0e1a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#9b9bb0] mb-1">{label}</p>
      {payload.map((p: any) => <p key={p.name} className="text-white font-semibold">{p.name}: {p.value?.toLocaleString()}</p>)}
    </div>
  );
};

export default function ChurnPage() {
  const { range, setRange } = useDateRange();
  const { data, loading, error, refresh } = useAnalytics<any>('churn', range);

  const totalCancelled = data?.dailyCancellations?.reduce((s: number, r: any) => s + r.count, 0) || 0;

  if (error) return <><PageHeader title="Churn Analysis" range={range} onRangeChange={setRange} /><ErrorState message={error} onRetry={refresh} /></>;

  return (
    <>
      <PageHeader title="Churn Analysis" subtitle="Cancellations and payment failures" range={range} onRangeChange={setRange} onRefresh={refresh} loading={loading} />

      {loading && !data ? <LoadingState /> : data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <KPICard title="Cancelled (period)" value={totalCancelled} icon={<TrendingDown className="w-5 h-5" />} color="#ef4444" />
            <KPICard title="Payment Failures" value={data.paymentFailures} icon={<AlertTriangle className="w-5 h-5" />} color="#f59e0b" />
            <KPICard title="Plans Churned" value={data.churnByPlan?.length || 0} color="#8b5cf6" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ChartCard title="Daily Cancellations">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.dailyCancellations}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9b9bb0' }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: '#9b9bb0' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} name="Cancellations" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Churn by Plan">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.churnByPlan}>
                  <XAxis dataKey="plan" tick={{ fontSize: 11, fill: '#9b9bb0' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9b9bb0' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Cancelled" radius={[4, 4, 0, 0]}>
                    {data.churnByPlan?.map((e: any, i: number) => (
                      <rect key={i} fill={PLAN_COLORS[e.plan] || '#6b7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </>
  );
}

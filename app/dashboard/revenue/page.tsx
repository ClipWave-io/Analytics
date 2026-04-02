'use client';

import { KPICard } from '@/app/components/KPICard';
import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { ChartCard } from '@/app/components/ChartCard';
import { DataTable } from '@/app/components/DataTable';
import { useDateRange, useAnalytics } from '@/app/hooks/useAnalytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign } from 'lucide-react';

const PLAN_COLORS: Record<string, string> = { starter: '#3388ff', pro: '#8b5cf6', agency: '#f59e0b' };
const PLAN_PRICES: Record<string, number> = { starter: 16, pro: 42, agency: 109 };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c0e1a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#9b9bb0] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-white font-semibold">{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</p>
      ))}
    </div>
  );
};

export default function RevenuePage() {
  const { range, setRange } = useDateRange();
  const { data, loading, error, refresh } = useAnalytics<any>('revenue', range);

  const mrr = data?.planDistribution?.reduce((s: number, r: any) => s + (PLAN_PRICES[r.plan] || 0) * r.count, 0) || 0;
  const totalSubs = data?.planDistribution?.reduce((s: number, r: any) => s + r.count, 0) || 0;
  const arpu = totalSubs > 0 ? (mrr / totalSubs) : 0;

  const pieData = data?.planDistribution?.map((r: any) => ({
    name: r.plan.charAt(0).toUpperCase() + r.plan.slice(1),
    value: r.count,
    color: PLAN_COLORS[r.plan] || '#6b7280',
  })) || [];

  if (error) return <><PageHeader title="Revenue & MRR" range={range} onRangeChange={setRange} /><ErrorState message={error} onRetry={refresh} /></>;

  return (
    <>
      <PageHeader title="Revenue & MRR" subtitle="Subscription revenue and plan analytics" range={range} onRangeChange={setRange} onRefresh={refresh} loading={loading} />

      {loading && !data ? <LoadingState /> : data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KPICard title="MRR" value={`$${mrr.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color="#3388ff" />
            <KPICard title="Subscribers" value={totalSubs} color="#8b5cf6" />
            <KPICard title="ARPU" value={`$${arpu.toFixed(0)}`} color="#22c55e" />
            <KPICard title="ARR" value={`$${(mrr * 12).toLocaleString()}`} color="#f59e0b" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ChartCard title="Plan Distribution">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-[#9b9bb0] py-8 text-center">No subscribers yet</p>}
            </ChartCard>

            <ChartCard title="Top-up Revenue by Day">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.topupsByDay}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9b9bb0' }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: '#9b9bb0' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" fill="#3388ff" radius={[4, 4, 0, 0]} name="Credits" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard title="Active Subscribers">
            <DataTable
              columns={[
                { key: 'email', label: 'Email' },
                { key: 'name', label: 'Name' },
                { key: 'plan', label: 'Plan', render: (v: string) => <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: `${PLAN_COLORS[v] || '#6b7280'}20`, color: PLAN_COLORS[v] || '#6b7280' }}>{v}</span> },
                { key: 'credits_remaining', label: 'Credits Left', align: 'right', render: (v: number) => (v ?? 0).toLocaleString() },
                { key: 'credits_used_this_period', label: 'Used', align: 'right', render: (v: number) => (v ?? 0).toLocaleString() },
                { key: 'created_at', label: 'Since', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
              ]}
              data={data.subscribers || []}
              exportFilename="subscribers"
            />
          </ChartCard>
        </>
      )}
    </>
  );
}

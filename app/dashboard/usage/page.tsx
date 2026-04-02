'use client';

import { KPICard } from '@/app/components/KPICard';
import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { ChartCard } from '@/app/components/ChartCard';
import { DataTable } from '@/app/components/DataTable';
import { useDateRange, useAnalytics } from '@/app/hooks/useAnalytics';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Zap, CheckCircle, XCircle } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e', done: '#22c55e', finished: '#22c55e',
  error: '#ef4444', failed: '#ef4444',
  running: '#3388ff', processing: '#3388ff',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c0e1a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#9b9bb0] mb-1">{label}</p>
      {payload.map((p: any) => <p key={p.name} className="text-white font-semibold">{p.name}: {p.value?.toLocaleString()}</p>)}
    </div>
  );
};

export default function UsagePage() {
  const { range, setRange } = useDateRange();
  const { data, loading, error, refresh } = useAnalytics<any>('usage', range);

  const totalRuns = data?.statusDistribution?.reduce((s: number, r: any) => s + r.count, 0) || 0;
  const completed = data?.statusDistribution?.filter((r: any) => ['completed','done','finished'].includes(r.status)).reduce((s: number, r: any) => s + r.count, 0) || 0;
  const failed = data?.statusDistribution?.filter((r: any) => ['error','failed'].includes(r.status)).reduce((s: number, r: any) => s + r.count, 0) || 0;
  const successRate = totalRuns > 0 ? ((completed / totalRuns) * 100) : 0;

  const statusPie = data?.statusDistribution?.map((r: any) => ({
    name: r.status, value: r.count, color: STATUS_COLORS[r.status] || '#6b7280',
  })) || [];

  if (error) return <><PageHeader title="Product Usage" range={range} onRangeChange={setRange} /><ErrorState message={error} onRetry={refresh} /></>;

  return (
    <>
      <PageHeader title="Product Usage" subtitle="Pipeline runs and video generation" range={range} onRangeChange={setRange} onRefresh={refresh} loading={loading} />

      {loading && !data ? <LoadingState /> : data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KPICard title="Total Runs" value={totalRuns} icon={<Zap className="w-5 h-5" />} color="#3388ff" />
            <KPICard title="Completed" value={completed} icon={<CheckCircle className="w-5 h-5" />} color="#22c55e" />
            <KPICard title="Failed" value={failed} icon={<XCircle className="w-5 h-5" />} color="#ef4444" />
            <KPICard title="Success Rate" value={`${successRate.toFixed(1)}%`} color="#22c55e" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ChartCard title="Daily Runs">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data.dailyRuns}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9b9bb0' }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: '#9b9bb0' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" stroke="#3388ff" fill="#3388ff" fillOpacity={0.1} name="Runs" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Status Distribution">
              {statusPie.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={statusPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                      {statusPie.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-[#9b9bb0] py-8 text-center">No data</p>}
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ChartCard title="Top Users by Runs">
              <ResponsiveContainer width="100%" height={Math.max(200, (data.topUsers?.length || 0) * 35)}>
                <BarChart data={data.topUsers} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9b9bb0' }} />
                  <YAxis type="category" dataKey="email" tick={{ fontSize: 10, fill: '#9b9bb0' }} width={160} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="runs" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Runs" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard title="Recent Runs">
            <DataTable
              columns={[
                { key: 'email', label: 'User' },
                { key: 'product_name', label: 'Product' },
                { key: 'status', label: 'Status', render: (v: string) => <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: `${STATUS_COLORS[v] || '#6b7280'}20`, color: STATUS_COLORS[v] || '#6b7280' }}>{v}</span> },
                { key: 'created_at', label: 'Date', render: (v: string) => v ? new Date(v).toLocaleString() : '-' },
              ]}
              data={data.recentRuns || []}
              exportFilename="pipeline-runs"
            />
          </ChartCard>
        </>
      )}
    </>
  );
}

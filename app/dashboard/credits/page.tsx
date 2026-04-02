'use client';

import { KPICard } from '@/app/components/KPICard';
import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { ChartCard } from '@/app/components/ChartCard';
import { DataTable } from '@/app/components/DataTable';
import { useDateRange, useAnalytics } from '@/app/hooks/useAnalytics';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Coins, AlertTriangle } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  video_gen: '#3388ff', keyframe: '#8b5cf6', pipeline_run: '#3388ff',
  llm_script: '#f59e0b', avatar_gen: '#22c55e', avatar_gen_pro: '#10b981',
  video_breakdown: '#ef4444', editor_transcribe: '#ec4899',
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

export default function CreditsPage() {
  const { range, setRange } = useDateRange();
  const { data, loading, error, refresh } = useAnalytics<any>('credits', range);

  const totalConsumed = data?.dailyUsage?.reduce((s: number, r: any) => s + r.consumed, 0) || 0;
  const avgUtil = data?.userUtilization?.length > 0
    ? (data.userUtilization.reduce((s: number, r: any) => s + parseFloat(r.utilization_pct || 0), 0) / data.userUtilization.length)
    : 0;

  const typePie = data?.usageByType?.map((r: any) => ({
    name: r.type, value: r.total, color: TYPE_COLORS[r.type] || '#6b7280',
  })) || [];

  // Utilization distribution buckets
  const buckets = [0, 0, 0, 0]; // 0-25, 25-50, 50-75, 75-100
  for (const u of data?.userUtilization || []) {
    const p = parseFloat(u.utilization_pct || 0);
    if (p < 25) buckets[0]++;
    else if (p < 50) buckets[1]++;
    else if (p < 75) buckets[2]++;
    else buckets[3]++;
  }
  const bucketData = [
    { range: '0-25%', count: buckets[0], fill: '#ef4444' },
    { range: '25-50%', count: buckets[1], fill: '#f59e0b' },
    { range: '50-75%', count: buckets[2], fill: '#3388ff' },
    { range: '75-100%', count: buckets[3], fill: '#22c55e' },
  ];

  if (error) return <><PageHeader title="Credit Economics" range={range} onRangeChange={setRange} /><ErrorState message={error} onRetry={refresh} /></>;

  return (
    <>
      <PageHeader title="Credit Economics" subtitle="Credit consumption and utilization" range={range} onRangeChange={setRange} onRefresh={refresh} loading={loading} />

      {loading && !data ? <LoadingState /> : data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KPICard title="Credits Consumed" value={totalConsumed.toLocaleString()} icon={<Coins className="w-5 h-5" />} color="#3388ff" />
            <KPICard title="Avg Utilization" value={`${avgUtil.toFixed(1)}%`} color="#8b5cf6" />
            <KPICard title="Users Exhausted" value={data.usersExhausted} icon={<AlertTriangle className="w-5 h-5" />} color="#ef4444" />
            <KPICard title="Types Tracked" value={data.usageByType?.length || 0} color="#22c55e" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ChartCard title="Daily Credit Consumption">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data.dailyUsage}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9b9bb0' }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: '#9b9bb0' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="consumed" stroke="#3388ff" fill="#3388ff" fillOpacity={0.1} name="Credits" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Usage by Operation">
              {typePie.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={typePie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value.toLocaleString()}`}>
                      {typePie.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-[#9b9bb0] py-8 text-center">No data</p>}
            </ChartCard>
          </div>

          <ChartCard title="Utilization Distribution" className="mb-8">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={bucketData}>
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#9b9bb0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9b9bb0' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Users" radius={[4, 4, 0, 0]}>
                  {bucketData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="User Credit Utilization">
            <DataTable
              columns={[
                { key: 'email', label: 'Email' },
                { key: 'plan', label: 'Plan', render: (v: string) => v || 'free' },
                { key: 'period_credits_total', label: 'Allocated', align: 'right', render: (v: number) => (v ?? 0).toLocaleString() },
                { key: 'credits_used_this_period', label: 'Used', align: 'right', render: (v: number) => (v ?? 0).toLocaleString() },
                { key: 'credits_remaining', label: 'Remaining', align: 'right', render: (v: number) => (v ?? 0).toLocaleString() },
                { key: 'utilization_pct', label: 'Util %', align: 'right', render: (v: any) => {
                  const pct = parseFloat(v || 0);
                  const color = pct > 90 ? '#22c55e' : pct > 50 ? '#3388ff' : pct > 10 ? '#f59e0b' : '#ef4444';
                  return <span style={{ color }} className="font-semibold">{pct.toFixed(1)}%</span>;
                }},
              ]}
              data={data.userUtilization || []}
              exportFilename="credit-utilization"
            />
          </ChartCard>
        </>
      )}
    </>
  );
}

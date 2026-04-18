'use client';

import { KPICard } from '@/app/components/KPICard';
import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { ChartCard } from '@/app/components/ChartCard';
import { DataTable } from '@/app/components/DataTable';
import { useDateRange, useAnalytics } from '@/app/hooks/useAnalytics';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Megaphone } from 'lucide-react';

const SOURCE_COLORS: Record<string, string> = {
  organic: '#22c55e', gilam: '#f59e0b', gpt: '#8b5cf6',
  google: '#4285f4', facebook: '#1877f2', '': '#6b7280',
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

export default function AcquisitionPage() {
  const { range, setRange } = useDateRange();
  const { data, loading, error, refresh } = useAnalytics<any>('acquisition', range);

  const totalVisits = data?.dailyVisits?.reduce((s: number, r: any) => s + r.count, 0) || 0;
  const sourcePie = data?.bySource?.filter((r: any) => r.source).map((r: any) => ({
    name: r.source, value: r.count, color: SOURCE_COLORS[r.source] || '#6b7280',
  })) || [];

  if (error) return <><PageHeader title="Acquisition" range={range} onRangeChange={setRange} /><ErrorState message={error} onRetry={refresh} /></>;

  return (
    <>
      <PageHeader title="Acquisition & Marketing" subtitle="Traffic sources and referrers" range={range} onRangeChange={setRange} onRefresh={refresh} loading={loading} />

      {loading && !data ? <LoadingState /> : data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <KPICard title="Total Visits" value={totalVisits.toLocaleString()} icon={<Megaphone className="w-5 h-5" />} color="#3388ff" />
            <KPICard title="Sources" value={data.bySource?.length || 0} color="#8b5cf6" />
            <KPICard title="Top Source" value={data.bySource?.[0]?.source || '-'} color="#22c55e" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ChartCard title="Daily Visits">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data.dailyVisits}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9b9bb0' }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: '#9b9bb0' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" stroke="#3388ff" fill="#3388ff" fillOpacity={0.1} name="Visits" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Traffic by Source">
              {sourcePie.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={sourcePie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                      {sourcePie.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-[#9b9bb0] py-8 text-center">No source data</p>}
            </ChartCard>
          </div>

          {data.topReferrers?.length > 0 && (
            <ChartCard title="Top Referrers">
              <DataTable
                columns={[
                  { key: 'referrer', label: 'Referrer', render: (v: string) => <span className="truncate max-w-xs block">{v}</span> },
                  { key: 'count', label: 'Visits', align: 'right', render: (v: number) => v.toLocaleString() },
                ]}
                data={data.topReferrers}
                exportFilename="referrers"
              />
            </ChartCard>
          )}
        </>
      )}
    </>
  );
}

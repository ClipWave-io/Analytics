'use client';

import { KPICard } from '@/app/components/KPICard';
import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { ChartCard } from '@/app/components/ChartCard';
import { DataTable } from '@/app/components/DataTable';
import { useDateRange, useAnalytics } from '@/app/hooks/useAnalytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Globe } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c0e1a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#9b9bb0] mb-1">{label}</p>
      {payload.map((p: any) => <p key={p.name} className="text-white font-semibold">{p.value?.toLocaleString()} events</p>)}
    </div>
  );
};

export default function GeoPage() {
  const { range, setRange } = useDateRange();
  const { data, loading, error, refresh } = useAnalytics<any>('geo', range);

  if (error) return <><PageHeader title="Geolocation" range={range} onRangeChange={setRange} /><ErrorState message={error} onRetry={refresh} /></>;

  const top = data?.countries?.slice(0, 20) || [];

  return (
    <>
      <PageHeader title="Geolocation" subtitle="Traffic by country" range={range} onRangeChange={setRange} onRefresh={refresh} loading={loading} />

      {loading && !data ? <LoadingState /> : data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <KPICard title="Countries" value={data.totalCountries} icon={<Globe className="w-5 h-5" />} color="#3388ff" />
            <KPICard title="Top Country" value={data.countries?.[0]?.country || '-'} color="#8b5cf6" />
            <KPICard title="Top Events" value={data.countries?.[0]?.count || 0} color="#22c55e" />
          </div>

          <ChartCard title="Top Countries" className="mb-8">
            <ResponsiveContainer width="100%" height={Math.max(300, top.length * 35)}>
              <BarChart data={top} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9b9bb0' }} />
                <YAxis type="category" dataKey="country" tick={{ fontSize: 11, fill: '#9b9bb0' }} width={140} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#3388ff" radius={[0, 4, 4, 0]} name="Events" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="All Countries">
            <DataTable
              columns={[
                { key: 'country', label: 'Country' },
                { key: 'code', label: 'Code' },
                { key: 'count', label: 'Events', align: 'right', render: (v: number) => v.toLocaleString() },
              ]}
              data={data.countries || []}
              exportFilename="geo-data"
            />
          </ChartCard>
        </>
      )}
    </>
  );
}

'use client';

import { KPICard } from '@/app/components/KPICard';
import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { ChartCard } from '@/app/components/ChartCard';
import { DataTable } from '@/app/components/DataTable';
import { useDateRange, useAnalytics } from '@/app/hooks/useAnalytics';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Cpu, Wallet, Activity } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c0e1a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#9b9bb0] mb-1">{label}</p>
      {payload.map((p: any) => <p key={p.name} className="text-white font-semibold">{p.name}: {typeof p.value === 'number' ? `$${p.value.toFixed(4)}` : p.value}</p>)}
    </div>
  );
};

export default function CostsPage() {
  const { range, setRange } = useDateRange();
  const { data, loading, error, refresh } = useAnalytics<any>('costs', range);

  if (error?.includes('FAL_KEY')) {
    return (
      <>
        <PageHeader title="API Costs & Margins" subtitle="fal.ai usage tracking" range={range} onRangeChange={setRange} />
        <ChartCard title="fal.ai Costs">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Cpu className="w-12 h-12 text-[#9b9bb0]/30 mb-4" />
            <p className="text-sm text-[#9b9bb0] mb-2">Requires fal.ai API key</p>
            <p className="text-xs text-[#9b9bb0]/60">Add your FAL_KEY to environment variables to enable cost tracking</p>
          </div>
        </ChartCard>
      </>
    );
  }

  if (error) return <><PageHeader title="API Costs" range={range} onRangeChange={setRange} /><ErrorState message={error} onRetry={refresh} /></>;

  return (
    <>
      <PageHeader title="API Costs & Margins" subtitle="fal.ai usage tracking" range={range} onRangeChange={setRange} onRefresh={refresh} loading={loading} />

      {loading && !data ? <LoadingState /> : data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KPICard title="Total Spend" value={`$${Number(data.totalCost).toFixed(2)}`} icon={<DollarSign className="w-5 h-5" />} color="#ef4444" />
            <KPICard title="Total Requests" value={data.totalRequests || 0} icon={<Activity className="w-5 h-5" />} color="#3388ff" />
            <KPICard title="Avg/Day" value={`$${data.dailyCosts?.length > 0 ? (Number(data.totalCost) / data.dailyCosts.length).toFixed(2) : '0.00'}`} icon={<DollarSign className="w-5 h-5" />} color="#f59e0b" />
            {data.creditBalance !== null && (
              <KPICard title="Credit Balance" value={`$${Number(data.creditBalance).toFixed(2)}`} icon={<Wallet className="w-5 h-5" />} color="#22c55e" />
            )}
          </div>

          {data.dailyCosts?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <ChartCard title="Daily Spend">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={data.dailyCosts}>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9b9bb0' }} tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11, fill: '#9b9bb0' }} tickFormatter={v => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="cost" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} name="Cost" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Daily Requests">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.dailyCosts}>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9b9bb0' }} tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11, fill: '#9b9bb0' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="requests" fill="#3388ff" radius={[4, 4, 0, 0]} name="Requests" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          <ChartCard title="Cost by Endpoint">
            <DataTable
              columns={[
                { key: 'endpoint', label: 'Endpoint', render: (v: string) => <span className="font-mono text-xs">{v}</span> },
                { key: 'requests', label: 'Requests', align: 'right', render: (v: number) => Number(v).toFixed(1) },
                { key: 'unit_price', label: 'Unit Price', align: 'right', render: (v: any) => `$${Number(v || 0).toFixed(2)}` },
                { key: 'cost', label: 'Total Cost', align: 'right', render: (v: any) => <span className="font-semibold">${Number(v).toFixed(2)}</span> },
              ]}
              data={data.costsByEndpoint || []}
              exportFilename="fal-ai-costs"
            />
          </ChartCard>
        </>
      )}
    </>
  );
}

'use client';

import { KPICard } from '@/app/components/KPICard';
import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { ChartCard } from '@/app/components/ChartCard';
import { DataTable } from '@/app/components/DataTable';
import { useDateRange, useAnalytics } from '@/app/hooks/useAnalytics';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c0e1a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#9b9bb0] mb-1">{label}</p>
      {payload.map((p: any) => <p key={p.name} className="text-white font-semibold">{p.name}: ${Number(p.value).toFixed(2)}</p>)}
    </div>
  );
};

export default function CostsPage() {
  const { range, setRange } = useDateRange();
  const { data, loading, error, refresh } = useAnalytics<any>('costs', range);

  if (error) return <><PageHeader title="API Costs" range={range} onRangeChange={setRange} /><ErrorState message={error} onRetry={refresh} /></>;

  return (
    <>
      <PageHeader title="API Costs & Margins" subtitle="Real API spend tracking" range={range} onRangeChange={setRange} onRefresh={refresh} loading={loading} />

      {loading && !data ? <LoadingState /> : data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <KPICard title="Total API Cost" value={`$${Number(data.totalCost).toFixed(2)}`} icon={<DollarSign className="w-5 h-5" />} color="#ef4444" />
            <KPICard title="Agents Tracked" value={data.costsByAgent?.length || 0} color="#3388ff" />
            <KPICard title="Avg/Day" value={`$${data.dailyCosts?.length > 0 ? (Number(data.totalCost) / data.dailyCosts.length).toFixed(2) : '0'}`} color="#f59e0b" />
          </div>

          <ChartCard title="Daily API Cost" className="mb-8">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.dailyCosts}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9b9bb0' }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#9b9bb0' }} tickFormatter={v => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="cost" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} name="Cost" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Cost by Agent">
            <DataTable
              columns={[
                { key: 'agent', label: 'Agent' },
                { key: 'runs', label: 'Runs', align: 'right', render: (v: number) => v.toLocaleString() },
                { key: 'input_tokens', label: 'Input Tokens', align: 'right', render: (v: number) => (v || 0).toLocaleString() },
                { key: 'output_tokens', label: 'Output Tokens', align: 'right', render: (v: number) => (v || 0).toLocaleString() },
                { key: 'cost', label: 'Cost', align: 'right', render: (v: any) => <span className="font-semibold">${Number(v).toFixed(2)}</span> },
              ]}
              data={data.costsByAgent || []}
              exportFilename="api-costs"
            />
          </ChartCard>
        </>
      )}
    </>
  );
}

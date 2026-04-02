'use client';

import { KPICard } from '@/app/components/KPICard';
import { ChartCard } from '@/app/components/ChartCard';
import { useAnalyticsNoRange } from '@/app/hooks/useAnalytics';
import { LoadingState, ErrorState } from '@/app/components/PageHeader';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Heart } from 'lucide-react';

const PLAN_COLORS: Record<string, string> = { starter: '#3388ff', pro: '#8b5cf6', agency: '#f59e0b' };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c0e1a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#9b9bb0] mb-1">{label}</p>
      {payload.map((p: any) => <p key={p.name} className="text-white font-semibold">{p.name}: ${p.value}</p>)}
    </div>
  );
};

export default function LTVPage() {
  const { data, loading, error, refresh } = useAnalyticsNoRange<any>('ltv');

  const avgLtv = data?.ltvByPlan?.length > 0
    ? Math.round(data.ltvByPlan.reduce((s: number, r: any) => s + r.ltv * r.users, 0) / data.ltvByPlan.reduce((s: number, r: any) => s + r.users, 0))
    : 0;

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Customer Lifetime Value</h1>
          <p className="text-sm text-[#9b9bb0] mt-1">Revenue per customer over their lifecycle</p>
        </div>
        <button onClick={refresh} className="px-4 py-2 rounded-xl bg-white/[0.04] text-sm text-[#9b9bb0] hover:bg-white/[0.07] transition-colors">Refresh</button>
      </div>

      {loading && !data ? <LoadingState /> : error ? <ErrorState message={error} onRetry={refresh} /> : data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <KPICard title="Average LTV" value={`$${avgLtv}`} icon={<Heart className="w-5 h-5" />} color="#3388ff" />
            <KPICard title="Avg Months" value={data.avgMonths?.toFixed(1) || 0} color="#8b5cf6" />
            <KPICard title="Plans Tracked" value={data.ltvByPlan?.length || 0} color="#22c55e" />
          </div>

          <ChartCard title="LTV by Plan" className="mb-8">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.ltvByPlan}>
                <XAxis dataKey="plan" tick={{ fontSize: 12, fill: '#9b9bb0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9b9bb0' }} tickFormatter={v => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="ltv" name="LTV" radius={[4, 4, 0, 0]}>
                  {data.ltvByPlan?.map((e: any, i: number) => (
                    <Cell key={i} fill={PLAN_COLORS[e.plan] || '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.ltvByPlan?.map((p: any) => (
              <div key={p.plan} className="card">
                <h3 className="text-sm font-semibold capitalize mb-3" style={{ color: PLAN_COLORS[p.plan] }}>{p.plan}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[#9b9bb0]">LTV</span><span className="font-semibold">${p.ltv}</span></div>
                  <div className="flex justify-between"><span className="text-[#9b9bb0]">Avg Months</span><span className="font-semibold">{p.avgMonths?.toFixed(1)}</span></div>
                  <div className="flex justify-between"><span className="text-[#9b9bb0]">Users</span><span className="font-semibold">{p.users}</span></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

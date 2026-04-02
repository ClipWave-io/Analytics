'use client';

import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { ChartCard } from '@/app/components/ChartCard';
import { KPICard } from '@/app/components/KPICard';
import { DataTable } from '@/app/components/DataTable';
import { useDateRange, useAnalytics } from '@/app/hooks/useAnalytics';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CreditCard, DollarSign, ShoppingCart, XCircle, TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c0e1a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#9b9bb0] mb-1">{label}</p>
      {payload.map((p: any) => <p key={p.name} className="text-white font-semibold">{p.name}: {typeof p.value === 'number' && p.name.includes('$') ? `$${p.value.toFixed(2)}` : p.value?.toLocaleString()}</p>)}
    </div>
  );
};

export default function CheckoutPage() {
  const { range, setRange } = useDateRange();
  const { data, loading, error, refresh } = useAnalytics<any>('checkout', range);

  if (error?.includes('STRIPE_SECRET_KEY')) {
    return (
      <>
        <PageHeader title="Checkout Funnel" subtitle="Stripe checkout analytics" range={range} onRangeChange={setRange} />
        <ChartCard title="Checkout Analytics">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CreditCard className="w-12 h-12 text-[#9b9bb0]/30 mb-4" />
            <p className="text-sm text-[#9b9bb0] mb-2">Requires Stripe API integration</p>
            <p className="text-xs text-[#9b9bb0]/60">Add your STRIPE_SECRET_KEY to environment variables to enable checkout funnel tracking</p>
          </div>
        </ChartCard>
      </>
    );
  }

  if (error) return <><PageHeader title="Checkout Funnel" range={range} onRangeChange={setRange} /><ErrorState message={error} onRetry={refresh} /></>;

  const k = data?.kpis;

  return (
    <>
      <PageHeader title="Checkout Funnel" subtitle="Stripe checkout analytics" range={range} onRangeChange={setRange} onRefresh={refresh} loading={loading} />

      {loading && !data ? <LoadingState /> : data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KPICard title="Total Sessions" value={k.totalSessions} icon={<ShoppingCart className="w-4 h-4" />} color="#3388ff" />
            <KPICard title="Completed" value={k.completedSessions} icon={<CreditCard className="w-4 h-4" />} color="#22c55e" />
            <KPICard title="Conversion Rate" value={`${k.conversionRate.toFixed(1)}%`} icon={<TrendingUp className="w-4 h-4" />} color="#f59e0b" />
            <KPICard title="Avg Order Value" value={`$${k.avgOrderValue.toFixed(2)}`} icon={<DollarSign className="w-4 h-4" />} color="#8b5cf6" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KPICard title="Revenue" value={`$${k.totalRevenue.toFixed(2)}`} icon={<DollarSign className="w-4 h-4" />} color="#22c55e" />
            <KPICard title="Refunded" value={`$${k.totalRefunded.toFixed(2)}`} icon={<XCircle className="w-4 h-4" />} color="#ef4444" />
            <KPICard title="Expired" value={k.expiredSessions} icon={<XCircle className="w-4 h-4" />} color="#ef4444" />
            <KPICard title="Open" value={k.openSessions} icon={<ShoppingCart className="w-4 h-4" />} color="#9b9bb0" />
          </div>

          {/* Funnel visualization */}
          <ChartCard title="Checkout Funnel" className="mb-8">
            <FunnelViz steps={[
              { label: 'Sessions Created', count: k.totalSessions, color: '#3388ff' },
              { label: 'Completed (Paid)', count: k.completedSessions, color: '#22c55e' },
            ]} />
          </ChartCard>

          {data.daily?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <ChartCard title="Daily Revenue">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={data.daily}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9b9bb0' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#9b9bb0' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} name="$ Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Daily Sessions">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.daily}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9b9bb0' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#9b9bb0' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} name="Completed" />
                    <Bar dataKey="expired" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expired" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          <ChartCard title="Recent Checkout Sessions">
            <DataTable
              columns={[
                { key: 'created', label: 'Date', render: (v: string) => <span className="text-xs">{v}</span> },
                { key: 'email', label: 'Email', render: (v: string) => <span className="font-mono text-xs">{v}</span> },
                { key: 'amount', label: 'Amount', align: 'right' as const, render: (v: number, row: any) => `$${v.toFixed(2)} ${row.currency}` },
                { key: 'status', label: 'Status', align: 'right' as const, render: (v: string) => (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${v === 'Paid' ? 'bg-[#22c55e]/10 text-[#22c55e]' : v === 'Expired' ? 'bg-[#ef4444]/10 text-[#ef4444]' : 'bg-white/[0.06] text-[#9b9bb0]'}`}>{v}</span>
                )},
              ]}
              data={data.recentSessions || []}
              exportFilename="checkout-sessions"
            />
          </ChartCard>
        </>
      )}
    </>
  );
}

function FunnelViz({ steps }: { steps: { label: string; count: number; color: string }[] }) {
  const max = Math.max(...steps.map(s => s.count), 1);
  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const pct = (step.count / max) * 100;
        const prev = i > 0 ? steps[i - 1].count : step.count;
        const dropoff = prev > 0 ? ((prev - step.count) / prev * 100) : 0;
        return (
          <div key={step.label} className="flex items-center gap-3">
            <span className="text-xs text-[#9b9bb0] w-36 shrink-0 text-right">{step.label}</span>
            <div className="flex-1 bg-white/[0.04] rounded-full h-8 overflow-hidden relative">
              <div className="h-full rounded-full flex items-center px-3 transition-all duration-500" style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: step.color }}>
                <span className="text-white text-xs font-bold whitespace-nowrap">{step.count.toLocaleString()}</span>
              </div>
            </div>
            <div className="w-16 shrink-0 text-right">
              {i > 0 && <span className={`text-xs font-semibold ${dropoff > 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>{dropoff > 0 ? `-${dropoff.toFixed(0)}%` : '0%'}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

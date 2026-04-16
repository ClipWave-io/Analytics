'use client';

import { KPICard } from '@/app/components/KPICard';
import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { useDateRange, useAnalytics } from '@/app/hooks/useAnalytics';
import {
  AreaChart, Area, BarChart, Bar, Line, ComposedChart,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import {
  DollarSign, Users, Zap, Activity, UserCheck, TrendingUp, TrendingDown,
  Eye, RefreshCw, UserPlus, UserMinus, AlertTriangle, Coins, Globe, Banknote,
  MousePointerClick, ShoppingCart, Target, ArrowUpDown,
} from 'lucide-react';

interface MoneyBucket { count: number; amount: number }
interface VisitorRow { ip: string; source: string; visited_at: string; country: string; countryCode: string }
interface OverviewData {
  totalUsers: number;
  newUsers: number;
  newUsersChange: number;
  activeUsers7d: number;
  mrr: number;
  activeSubscribers: number;
  trialing: number;
  pastDue: number;
  cancelScheduled: number;
  trialConverted: number;
  trialFailed: number;
  trialRenewalRate: number;
  totalRuns: number;
  totalRunsChange: number;
  completedRuns: number;
  totalEvents: number;
  money: {
    today: {
      cashIn: number;
      newSubs: MoneyBucket;
      renewals: MoneyBucket;
      topups: MoneyBucket;
      cancellations: number;
    };
    range: {
      cashIn: number;
      newSubs: MoneyBucket;
      renewals: MoneyBucket;
      updates: MoneyBucket;
      topups: MoneyBucket;
      cancellations: number;
      revenueBySource: Array<{ source: string; revenue: number; count: number }>;
    };
    daily: Array<{ date: string; newSubs: number; renewals: number; topups: number; cancellations: number }>;
    stripeConfigured: boolean;
  };
  extras: {
    arr: number;
    churnRate: number;
    cancelledInRange: number;
    avgLtv: number;
    errors: number;
    creditsConsumed: number;
    traffic: {
      uniqueVisitors: number;
      topSources: Array<{ source: string; visitors: number }>;
    };
    funnel: {
      visitors: number;
      pageviews: number;
      signups: number;
      checkoutsStarted: number;
      checkoutsPaid: number;
      checkoutRevenue: number;
      conversionRate: number;
      signupRate: number;
      checkoutConversion: number;
    };
  };
  visitors: VisitorRow[];
}

const fmtMoney = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MoneyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c0e1a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#9b9bb0] mb-1">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any) => (
        <p key={p.name} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {p.name === 'Cancellations' ? p.value : fmtMoney(p.value || 0)}
        </p>
      ))}
    </div>
  );
};

export default function OverviewPage() {
  const { range, setRange, compare, setCompare } = useDateRange();
  const { data, loading, error, refresh } = useAnalytics<OverviewData>('overview', range);

  if (error) return <><PageHeader title="Overview" range={range} onRangeChange={setRange} /><ErrorState message={error} onRetry={refresh} /></>;

  return (
    <>
      <PageHeader
        title="Command Center"
        subtitle="Everything that matters, at a glance"
        range={range}
        onRangeChange={setRange}
        compare={compare}
        onCompareChange={setCompare}
        onRefresh={refresh}
        loading={loading}
      />

      {loading && !data ? <LoadingState /> : data && (
        <>
          {/* ══════════════════════════════════════════════════ */}
          {/* ROW 1a — MONEY TODAY (always today, small) */}
          {/* ══════════════════════════════════════════════════ */}
          <div className="flex items-center gap-2 mb-3 mt-2">
            <Banknote className="w-4 h-4 text-[#22c55e]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#9b9bb0]">Today (live)</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <CompactKPI label="Cash In" value={fmtMoney(data.money.today.cashIn)} color="#22c55e" />
            <CompactKPI label="New Subs" value={String(data.money.today.newSubs.count)} color="#3388ff" />
            <CompactKPI label="Renewals" value={String(data.money.today.renewals.count)} color="#8b5cf6" />
            <CompactKPI label="Top-ups" value={String(data.money.today.topups.count)} color="#f59e0b" />
            <CompactKPI label="Cancellations" value={String(data.money.today.cancellations)} color="#ef4444" />
          </div>

          {/* ══════════════════════════════════════════════════ */}
          {/* ROW 1b — MONEY RANGE (follows date picker) */}
          {/* ══════════════════════════════════════════════════ */}
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-[#3388ff]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#9b9bb0]">Money · {range.label}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <KPICard
              title="Cash In"
              value={fmtMoney(data.money.range.cashIn)}
              icon={<DollarSign className="w-5 h-5" />}
              color="#22c55e"
            />
            <KPICard
              title="New Subs"
              value={data.money.range.newSubs.count}
              suffix={data.money.range.newSubs.amount > 0 ? ` · ${fmtMoney(data.money.range.newSubs.amount)}` : ''}
              icon={<UserPlus className="w-5 h-5" />}
              color="#3388ff"
            />
            <KPICard
              title="Renewals"
              value={data.money.range.renewals.count}
              suffix={data.money.range.renewals.amount > 0 ? ` · ${fmtMoney(data.money.range.renewals.amount)}` : ''}
              icon={<RefreshCw className="w-5 h-5" />}
              color="#8b5cf6"
            />
            <KPICard
              title="Updates"
              value={data.money.range.updates.count}
              suffix={data.money.range.updates.amount > 0 ? ` · ${fmtMoney(data.money.range.updates.amount)}` : ''}
              icon={<ArrowUpDown className="w-5 h-5" />}
              color="#06b6d4"
            />
            <KPICard
              title="Top-ups"
              value={data.money.range.topups.count}
              suffix={data.money.range.topups.amount > 0 ? ` · ${fmtMoney(data.money.range.topups.amount)}` : ''}
              icon={<Coins className="w-5 h-5" />}
              color="#f59e0b"
            />
            <KPICard
              title="Cancellations"
              value={data.money.range.cancellations}
              icon={<UserMinus className="w-5 h-5" />}
              color="#ef4444"
            />
          </div>

          {!data.money.stripeConfigured && (
            <div className="mb-6 p-3 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-xs text-[#f59e0b]">
              STRIPE_SECRET_KEY not configured — new subs / renewals / invoices will show 0. Top-ups and cancellations still work from DB.
            </div>
          )}

          {/* ══════════════════════════════════════════════════ */}
          {/* ROW 2 — HEALTH */}
          {/* ══════════════════════════════════════════════════ */}
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[#3388ff]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#9b9bb0]">Business Health</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-4 mb-8">
            <KPICard title="MRR" value={fmtMoney(data.mrr)} icon={<DollarSign className="w-5 h-5" />} color="#3388ff" />
            <KPICard title="ARR" value={fmtMoney(data.extras.arr)} icon={<TrendingUp className="w-5 h-5" />} color="#22c55e" />
            <KPICard title="Active Paying" value={data.activeSubscribers} icon={<UserCheck className="w-5 h-5" />} color="#8b5cf6" />
            <KPICard title="In Trial" value={data.trialing} icon={<Users className="w-5 h-5" />} color="#06b6d4" />
            <KPICard
              title="Trial Conv."
              value={`${data.trialRenewalRate}%`}
              icon={<Target className="w-5 h-5" />}
              color={data.trialRenewalRate > 50 ? '#22c55e' : '#f59e0b'}
            />
            <KPICard title="Failed Upgrades" value={data.trialFailed} icon={<AlertTriangle className="w-5 h-5" />} color={data.trialFailed > 0 ? '#ef4444' : '#9b9bb0'} />
            <KPICard title="Past Due" value={data.pastDue - data.trialFailed} icon={<AlertTriangle className="w-5 h-5" />} color={data.pastDue - data.trialFailed > 0 ? '#ef4444' : '#9b9bb0'} />
            <KPICard
              title="Churn Rate"
              value={`${data.extras.churnRate.toFixed(1)}%`}
              icon={<TrendingDown className="w-5 h-5" />}
              color={data.extras.churnRate > 5 ? '#ef4444' : '#22c55e'}
            />
            <KPICard title="Avg LTV" value={fmtMoney(data.extras.avgLtv)} icon={<TrendingUp className="w-5 h-5" />} color="#f59e0b" />
          </div>

          {/* ══════════════════════════════════════════════════ */}
          {/* ROW 3 — GROWTH & PRODUCT (range) */}
          {/* ══════════════════════════════════════════════════ */}
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-[#f59e0b]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#9b9bb0]">Growth &amp; Product · Range</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <KPICard
              title="New Users"
              value={data.newUsers}
              change={data.newUsersChange}
              changeLabel="vs prev"
              icon={<Users className="w-5 h-5" />}
              color="#3388ff"
            />
            <KPICard
              title="Pipeline Runs"
              value={data.totalRuns}
              change={data.totalRunsChange}
              changeLabel="vs prev"
              icon={<Zap className="w-5 h-5" />}
              color="#22c55e"
            />
            <KPICard title="Completed" value={data.completedRuns} icon={<Activity className="w-5 h-5" />} color="#8b5cf6" />
            <KPICard title="In Progress" value={data.totalRuns - data.completedRuns - data.extras.errors} icon={<RefreshCw className="w-5 h-5" />} color="#06b6d4" />
            <KPICard title="Errors" value={data.extras.errors} icon={<AlertTriangle className="w-5 h-5" />} color={data.extras.errors > 0 ? '#ef4444' : '#9b9bb0'} />
            <KPICard title="Credits Used" value={data.extras.creditsConsumed} icon={<Coins className="w-5 h-5" />} color="#f59e0b" />
          </div>

          {/* ══════════════════════════════════════════════════ */}
          {/* ACQUISITION FUNNEL — Visitors → Signups → Checkout → Paid */}
          {/* ══════════════════════════════════════════════════ */}
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-[#a855f7]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#9b9bb0]">Acquisition Funnel · {range.label}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
            <KPICard title="Visitors" value={data.extras.funnel.visitors} icon={<Eye className="w-5 h-5" />} color="#3388ff" />
            <KPICard title="Sessions" value={data.extras.funnel.pageviews} icon={<MousePointerClick className="w-5 h-5" />} color="#06b6d4" />
            <KPICard title="Signups" value={data.extras.funnel.signups} icon={<UserPlus className="w-5 h-5" />} color="#8b5cf6" />
            <KPICard title="Checkout Started" value={data.extras.funnel.checkoutsStarted} icon={<ShoppingCart className="w-5 h-5" />} color="#f59e0b" />
            <KPICard title="Purchases" value={data.extras.funnel.checkoutsPaid} icon={<DollarSign className="w-5 h-5" />} color="#22c55e" />
            <KPICard
              title="Conv. Rate"
              value={`${data.extras.funnel.conversionRate.toFixed(2)}%`}
              icon={<Target className="w-5 h-5" />}
              color={data.extras.funnel.conversionRate > 1 ? '#22c55e' : '#9b9bb0'}
            />
          </div>
          <div className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] p-4 mb-8 text-xs text-[#9b9bb0] flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-6 flex-wrap">
              <span>
                <span className="text-[#3388ff] font-semibold">{data.extras.funnel.visitors.toLocaleString()}</span> visits →{' '}
                <span className="text-[#8b5cf6] font-semibold">{data.extras.funnel.signups.toLocaleString()}</span> signups
                {' '}<span className="text-white/50">({data.extras.funnel.signupRate.toFixed(1)}%)</span>
              </span>
              <span>
                <span className="text-[#8b5cf6] font-semibold">{data.extras.funnel.signups.toLocaleString()}</span> signups →{' '}
                <span className="text-[#22c55e] font-semibold">{data.extras.funnel.checkoutsPaid.toLocaleString()}</span> purchases
                {' '}<span className="text-white/50">({data.extras.funnel.signups > 0 ? ((data.extras.funnel.checkoutsPaid / data.extras.funnel.signups) * 100).toFixed(1) : '0.0'}%)</span>
              </span>
              <span>
                Checkout → paid:{' '}
                <span className="text-white font-semibold">{data.extras.funnel.checkoutConversion.toFixed(1)}%</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[#9b9bb0]">Revenue per visit:{' '}</span>
              <span className="text-[#22c55e] font-bold">
                ${data.extras.funnel.visitors > 0 ? (data.extras.funnel.checkoutRevenue / data.extras.funnel.visitors).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════ */}
          {/* MAIN CHART — Daily revenue multi-series + cancellations */}
          {/* ══════════════════════════════════════════════════ */}
          <div className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] p-6 mb-8">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-semibold">Daily Revenue Breakdown</h3>
                <p className="text-xs text-[#9b9bb0] mt-0.5">New subs · Renewals · Top-ups (bars) + Cancellations (line)</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#9b9bb0]">Range cash in</p>
                <p className="text-xl font-bold text-[#22c55e]">{fmtMoney(data.money.range.cashIn)}</p>
              </div>
            </div>
            {data.money.daily.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={data.money.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9b9bb0' }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis yAxisId="money" tick={{ fontSize: 10, fill: '#9b9bb0' }} tickFormatter={(v) => `$${v}`} />
                  <YAxis yAxisId="count" orientation="right" tick={{ fontSize: 10, fill: '#9b9bb0' }} />
                  <Tooltip content={<MoneyTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="money" dataKey="newSubs" stackId="rev" fill="#3388ff" name="New Subs" radius={[0, 0, 0, 0]} />
                  <Bar yAxisId="money" dataKey="renewals" stackId="rev" fill="#8b5cf6" name="Renewals" radius={[0, 0, 0, 0]} />
                  <Bar yAxisId="money" dataKey="topups" stackId="rev" fill="#f59e0b" name="Top-ups" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="count" type="monotone" dataKey="cancellations" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Cancellations" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[#9b9bb0] text-center py-16">No revenue data for this period</p>
            )}
          </div>

          {/* ══════════════════════════════════════════════════ */}
          {/* RANGE MONEY SUMMARY + TRAFFIC SNAPSHOT */}
          {/* ══════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Money summary */}
            <div className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] p-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#22c55e]" />
                Range Breakdown
              </h3>
              <div className="space-y-3 text-sm">
                <MoneyRow label="New subscriptions" amount={data.money.range.newSubs.amount} count={data.money.range.newSubs.count} color="#3388ff" />
                <MoneyRow label="Renewals" amount={data.money.range.renewals.amount} count={data.money.range.renewals.count} color="#8b5cf6" />
                <MoneyRow label="Upgrades/downgrades" amount={data.money.range.updates.amount} count={data.money.range.updates.count} color="#a855f7" />
                <MoneyRow label="Top-ups" amount={data.money.range.topups.amount} count={data.money.range.topups.count} color="#f59e0b" />
                <div className="border-t border-white/[0.06] pt-3 mt-3 flex items-center justify-between">
                  <span className="font-semibold">Cancellations</span>
                  <span className="font-bold text-[#ef4444]">{data.money.range.cancellations}</span>
                </div>
              </div>
            </div>

            {/* Revenue by Source */}
            <div className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#f59e0b]" />
                  Revenue by Source
                </h3>
                <div className="text-right">
                  <p className="text-xs text-[#9b9bb0]">Total attributed</p>
                  <p className="text-xl font-bold text-[#f59e0b]">
                    {fmtMoney((data.money.range.revenueBySource || []).reduce((s, x) => s + x.revenue, 0))}
                  </p>
                </div>
              </div>
              {(data.money.range.revenueBySource || []).length > 0 ? (
                <div className="space-y-2.5">
                  {data.money.range.revenueBySource.map((s) => {
                    const max = Math.max(...data.money.range.revenueBySource.map((x) => x.revenue));
                    return (
                      <div key={s.source} className="flex items-center gap-3">
                        <div className="w-20 text-xs font-medium truncate">{s.source}</div>
                        <div className="flex-1 relative h-7 bg-white/[0.03] rounded-lg overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded-lg bg-[#f59e0b]/25"
                            style={{ width: `${(s.revenue / max) * 100}%` }}
                          />
                          <div className="absolute inset-0 flex items-center justify-between px-3 text-[11px]">
                            <span className="text-white font-semibold">{fmtMoney(s.revenue)}</span>
                            <span className="text-[#9b9bb0]">{s.count} txn</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[#9b9bb0] text-center py-8">No revenue data for this period</p>
              )}
            </div>

            {/* Traffic snapshot */}
            <div className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#3388ff]" />
                  Traffic Snapshot
                </h3>
                <div className="text-right">
                  <p className="text-xs text-[#9b9bb0]">Unique visitors</p>
                  <p className="text-xl font-bold">{data.extras.traffic.uniqueVisitors.toLocaleString()}</p>
                </div>
              </div>
              {data.extras.traffic.topSources.length > 0 ? (
                <div className="space-y-2.5">
                  {data.extras.traffic.topSources.map((s) => {
                    const max = Math.max(...data.extras.traffic.topSources.map((x) => x.visitors));
                    return (
                      <div key={s.source} className="flex items-center gap-4">
                        <div className="w-28 text-xs font-medium truncate">{s.source}</div>
                        <div className="flex-1 relative h-7 bg-white/[0.03] rounded-lg overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded-lg bg-[#3388ff]/25"
                            style={{ width: `${(s.visitors / max) * 100}%` }}
                          />
                          <div className="absolute inset-0 flex items-center px-3 text-[11px]">
                            <span className="text-white font-semibold">{s.visitors.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[#9b9bb0] text-center py-8">No traffic data for this period</p>
              )}
            </div>
          </div>

          {/* Secondary: Events + Total Users */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KPICard title="Total Users" value={data.totalUsers} icon={<Users className="w-5 h-5" />} color="#8b5cf6" />
            <KPICard title="Active (7d)" value={data.activeUsers7d} icon={<UserCheck className="w-5 h-5" />} color="#22c55e" />
            <KPICard title="Events" value={data.totalEvents} icon={<Eye className="w-5 h-5" />} color="#9b9bb0" />
            <KPICard title="Cancelled (range)" value={data.extras.cancelledInRange} icon={<UserMinus className="w-5 h-5" />} color="#ef4444" />
          </div>

          {/* ══════════════════════════════════════════════════ */}
          {/* UNIQUE VISITOR LOG (all sources) */}
          {/* ══════════════════════════════════════════════════ */}
          {data.visitors?.length > 0 && (
            <div className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#3388ff]" />
                  Unique Visitor Log
                </h3>
                <span className="text-xs text-[#9b9bb0]">{data.visitors.length.toLocaleString()} unique visitors · all sources</span>
              </div>
              <div className="max-h-[500px] overflow-y-auto rounded-xl">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[#0a0a1a]">
                    <tr className="text-[#9b9bb0] border-b border-white/[0.06]">
                      <th className="text-left py-2 px-3 font-medium">Date</th>
                      <th className="text-left py-2 px-3 font-medium">IP</th>
                      <th className="text-left py-2 px-3 font-medium">Country</th>
                      <th className="text-left py-2 px-3 font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.visitors.map((v, i) => (
                      <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="py-2 px-3 text-[#9b9bb0]">{v.visited_at?.slice(0, 16).replace('T', ' ')}</td>
                        <td className="py-2 px-3 font-mono">{v.ip}</td>
                        <td className="py-2 px-3">{v.country}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#3388ff]/15 text-[#5ca8ff]">
                            {v.source}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

function CompactKPI({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#0a0a1a] rounded-xl border border-white/[0.05] px-3 py-2.5 flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-[11px] text-[#9b9bb0] truncate">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="text-sm font-bold tabular-nums">{value}</span>
    </div>
  );
}

function MoneyRow({ label, amount, count, color }: { label: string; amount: number; count: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-[#9b9bb0]">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-semibold">
        {fmtMoney(amount)} <span className="text-[#9b9bb0] font-normal">· {count}</span>
      </span>
    </div>
  );
}

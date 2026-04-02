'use client';

import { KPICard } from '@/app/components/KPICard';
import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { ChartCard } from '@/app/components/ChartCard';
import { useDateRange, useAnalytics } from '@/app/hooks/useAnalytics';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, Zap, Activity, UserCheck, TrendingUp, BarChart3, Eye } from 'lucide-react';

interface OverviewData {
  totalUsers: number;
  newUsers: number;
  newUsersChange: number;
  activeUsers7d: number;
  mrr: number;
  activeSubscribers: number;
  totalRuns: number;
  totalRunsChange: number;
  completedRuns: number;
  totalEvents: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c0e1a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#9b9bb0] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-white font-semibold">{p.name}: {p.value?.toLocaleString()}</p>
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
        title="Overview"
        subtitle="Key metrics at a glance"
        range={range}
        onRangeChange={setRange}
        compare={compare}
        onCompareChange={setCompare}
        onRefresh={refresh}
        loading={loading}
      />

      {loading && !data ? <LoadingState /> : data && (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KPICard title="MRR" value={`$${data.mrr.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color="#3388ff" />
            <KPICard title="Total Users" value={data.totalUsers} icon={<Users className="w-5 h-5" />} color="#8b5cf6" />
            <KPICard title="Active (7d)" value={data.activeUsers7d} icon={<UserCheck className="w-5 h-5" />} color="#22c55e" />
            <KPICard title="Subscribers" value={data.activeSubscribers} icon={<TrendingUp className="w-5 h-5" />} color="#f59e0b" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KPICard title="New Users" value={data.newUsers} change={data.newUsersChange} changeLabel="vs prev period" icon={<Users className="w-5 h-5" />} />
            <KPICard title="Pipeline Runs" value={data.totalRuns} change={data.totalRunsChange} changeLabel="vs prev period" icon={<Zap className="w-5 h-5" />} />
            <KPICard title="Completed" value={data.completedRuns} icon={<Activity className="w-5 h-5" />} color="#22c55e" />
            <KPICard title="Total Events" value={data.totalEvents} icon={<Eye className="w-5 h-5" />} />
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { href: '/dashboard/revenue', label: 'Revenue Details', icon: DollarSign, color: '#3388ff' },
              { href: '/dashboard/users', label: 'User Analytics', icon: Users, color: '#8b5cf6' },
              { href: '/dashboard/usage', label: 'Product Usage', icon: Zap, color: '#22c55e' },
              { href: '/dashboard/live', label: 'Live View', icon: Activity, color: '#ef4444' },
            ].map(link => (
              <a key={link.href} href={link.href} className="card flex items-center gap-3 no-underline hover:border-white/[0.15] transition-colors">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${link.color}15` }}>
                  <link.icon className="w-4 h-4" style={{ color: link.color }} />
                </div>
                <span className="text-sm font-medium">{link.label}</span>
              </a>
            ))}
          </div>
        </>
      )}
    </>
  );
}

'use client';

import { KPICard } from '@/app/components/KPICard';
import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { ChartCard } from '@/app/components/ChartCard';
import { DataTable } from '@/app/components/DataTable';
import { useDateRange, useAnalytics } from '@/app/hooks/useAnalytics';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, UserPlus } from 'lucide-react';

const AUTH_COLORS: Record<string, string> = { google: '#ea4335', email: '#3388ff' };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c0e1a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#9b9bb0] mb-1">{label}</p>
      {payload.map((p: any) => <p key={p.name} className="text-white font-semibold">{p.name}: {p.value?.toLocaleString()}</p>)}
    </div>
  );
};

export default function UsersPage() {
  const { range, setRange } = useDateRange();
  const { data, loading, error, refresh } = useAnalytics<any>('users', range);

  const totalNew = data?.dailyRegistrations?.reduce((s: number, r: any) => s + r.count, 0) || 0;
  const authPie = data?.authProviderSplit?.map((r: any) => ({
    name: r.auth_provider || 'email',
    value: r.count,
    color: AUTH_COLORS[r.auth_provider] || '#6b7280',
  })) || [];

  if (error) return <><PageHeader title="Users" range={range} onRangeChange={setRange} /><ErrorState message={error} onRetry={refresh} /></>;

  return (
    <>
      <PageHeader title="Users" subtitle="Registration and user analytics" range={range} onRangeChange={setRange} onRefresh={refresh} loading={loading} />

      {loading && !data ? <LoadingState /> : data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <KPICard title="New Users (period)" value={totalNew} icon={<UserPlus className="w-5 h-5" />} color="#3388ff" />
            <KPICard title="Sources" value={data.sources?.length || 0} color="#8b5cf6" />
            <KPICard title="Auth Providers" value={data.authProviderSplit?.length || 0} color="#22c55e" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ChartCard title="Daily Registrations">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data.dailyRegistrations}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9b9bb0' }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: '#9b9bb0' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" stroke="#3388ff" fill="#3388ff" fillOpacity={0.1} name="Registrations" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Auth Provider Split">
              {authPie.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={authPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                      {authPie.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-[#9b9bb0] py-8 text-center">No data</p>}
            </ChartCard>
          </div>

          {data.sources?.length > 0 && (
            <ChartCard title="Registration Sources" className="mb-8">
              <ResponsiveContainer width="100%" height={Math.max(150, data.sources.length * 35)}>
                <BarChart data={data.sources} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9b9bb0' }} />
                  <YAxis type="category" dataKey="source" tick={{ fontSize: 11, fill: '#9b9bb0' }} width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Users" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          <ChartCard title="Recent Users">
            <DataTable
              columns={[
                { key: 'email', label: 'Email' },
                { key: 'name', label: 'Name' },
                { key: 'source', label: 'Source' },
                { key: 'auth_provider', label: 'Auth' },
                { key: 'plan', label: 'Plan', render: (v: string) => v || 'free' },
                { key: 'credits_remaining', label: 'Credits', align: 'right', render: (v: number) => (v ?? 0).toLocaleString() },
                { key: 'created_at', label: 'Joined', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
              ]}
              data={data.recentUsers || []}
              exportFilename="users"
            />
          </ChartCard>
        </>
      )}
    </>
  );
}

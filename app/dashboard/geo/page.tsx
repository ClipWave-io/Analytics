'use client';

import { useState } from 'react';
import { KPICard } from '@/app/components/KPICard';
import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { ChartCard } from '@/app/components/ChartCard';
import { DataTable } from '@/app/components/DataTable';
import { useDateRange, useAnalytics } from '@/app/hooks/useAnalytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Globe, Users, CreditCard, Monitor } from 'lucide-react';

const TABS = [
  { key: 'events', label: 'Events by Country', icon: Globe },
  { key: 'ips', label: 'Individual IPs', icon: Monitor },
  { key: 'users', label: 'Registered Users', icon: Users },
  { key: 'subscribers', label: 'Paying Users', icon: CreditCard },
] as const;

type TabKey = typeof TABS[number]['key'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c0e1a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#9b9bb0] mb-1">{label}</p>
      {payload.map((p: any) => <p key={p.name} className="text-white font-semibold">{p.value?.toLocaleString()}</p>)}
    </div>
  );
};

export default function GeoPage() {
  const { range, setRange } = useDateRange();
  const { data, loading, error, refresh } = useAnalytics<any>('geo', range);
  const [tab, setTab] = useState<TabKey>('events');

  if (error) return <><PageHeader title="Geolocation" range={range} onRangeChange={setRange} /><ErrorState message={error} onRetry={refresh} /></>;

  return (
    <>
      <PageHeader title="Geolocation" subtitle="Traffic & users by location" range={range} onRangeChange={setRange} onRefresh={refresh} loading={loading} />

      {loading && !data ? <LoadingState /> : data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KPICard title="Countries" value={data.totalCountries} icon={<Globe className="w-5 h-5" />} color="#3388ff" />
            <KPICard title="Unique IPs" value={data.ipSessions?.length || 0} icon={<Monitor className="w-5 h-5" />} color="#8b5cf6" />
            <KPICard title="Users Located" value={data.usersByCountry?.reduce((s: number, c: any) => s + c.count, 0) || 0} icon={<Users className="w-5 h-5" />} color="#22c55e" />
            <KPICard title="Subscribers Located" value={data.subsWithGeo?.length || 0} icon={<CreditCard className="w-5 h-5" />} color="#f59e0b" />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-white/[0.03] rounded-xl p-1 w-fit">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.key ? 'bg-white/[0.08] text-white' : 'text-[#9b9bb0] hover:text-white'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Events by Country */}
          {tab === 'events' && (
            <>
              <ChartCard title="Top Countries by Events" className="mb-8">
                <ResponsiveContainer width="100%" height={Math.max(300, (data.countries?.slice(0, 20).length || 0) * 35)}>
                  <BarChart data={data.countries?.slice(0, 20)} layout="vertical">
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
                  exportFilename="geo-events"
                />
              </ChartCard>
            </>
          )}

          {/* Individual IPs */}
          {tab === 'ips' && (
            <ChartCard title="Sessions by IP">
              <DataTable
                columns={[
                  { key: 'ip', label: 'IP Address', render: (v: string) => <span className="font-mono text-xs">{v}</span> },
                  { key: 'country', label: 'Country' },
                  { key: 'city', label: 'City' },
                  { key: 'events', label: 'Events', align: 'right', render: (v: number) => v.toLocaleString() },
                  { key: 'accounts', label: 'Accounts', align: 'right', render: (v: number, row: any) => (
                    <span className={`font-semibold ${v >= 3 ? 'text-[#ef4444]' : v >= 2 ? 'text-[#f59e0b]' : 'text-[#9b9bb0]'}`}>{v}</span>
                  )},
                  { key: 'emails', label: 'Emails', render: (v: string[]) => v?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {v.map(email => (
                        <span key={email} className="font-mono text-xs px-2 py-0.5 rounded bg-white/[0.04]">{email}</span>
                      ))}
                    </div>
                  ) : <span className="text-[#9b9bb0]">—</span> },
                ]}
                data={data.ipSessions || []}
                exportFilename="geo-ips"
              />
            </ChartCard>
          )}

          {/* Registered Users */}
          {tab === 'users' && (
            <>
              <ChartCard title="Registered Users by Country" className="mb-8">
                <ResponsiveContainer width="100%" height={Math.max(250, (data.usersByCountry?.slice(0, 15).length || 0) * 35)}>
                  <BarChart data={data.usersByCountry?.slice(0, 15)} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9b9bb0' }} />
                    <YAxis type="category" dataKey="country" tick={{ fontSize: 11, fill: '#9b9bb0' }} width={140} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} name="Users" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="All Registered Users">
                <DataTable
                  columns={[
                    { key: 'email', label: 'Email', render: (v: string) => <span className="font-mono text-xs">{v}</span> },
                    { key: 'country', label: 'Country' },
                    { key: 'city', label: 'City' },
                    { key: 'registered_at', label: 'Registered', render: (v: string) => v?.slice(0, 10) || '—' },
                  ]}
                  data={data.usersWithGeo || []}
                  exportFilename="geo-users"
                />
              </ChartCard>
            </>
          )}

          {/* Paying Subscribers */}
          {tab === 'subscribers' && (
            <>
              <ChartCard title="Paying Users by Country" className="mb-8">
                {data.subsByCountry?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(200, (data.subsByCountry?.length || 0) * 35)}>
                    <BarChart data={data.subsByCountry} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#9b9bb0' }} />
                      <YAxis type="category" dataKey="country" tick={{ fontSize: 11, fill: '#9b9bb0' }} width={140} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Subscribers" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-[#9b9bb0] text-center py-8">No active subscribers found</p>
                )}
              </ChartCard>
              <ChartCard title="All Paying Users">
                <DataTable
                  columns={[
                    { key: 'email', label: 'Email', render: (v: string) => <span className="font-mono text-xs">{v}</span> },
                    { key: 'plan', label: 'Plan', render: (v: string) => <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#f59e0b]/10 text-[#f59e0b]">{v}</span> },
                    { key: 'country', label: 'Country' },
                    { key: 'city', label: 'City' },
                  ]}
                  data={data.subsWithGeo || []}
                  exportFilename="geo-subscribers"
                />
              </ChartCard>
            </>
          )}
        </>
      )}
    </>
  );
}

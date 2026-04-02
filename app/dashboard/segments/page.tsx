'use client';

import { useState } from 'react';
import { KPICard } from '@/app/components/KPICard';
import { ChartCard } from '@/app/components/ChartCard';
import { DataTable } from '@/app/components/DataTable';
import { useAnalyticsNoRange } from '@/app/hooks/useAnalytics';
import { LoadingState, ErrorState } from '@/app/components/PageHeader';
import { Crown, AlertTriangle, Moon, TrendingUp, UserPlus } from 'lucide-react';

const SEGMENTS = [
  { key: 'powerUsers', label: 'Power Users', desc: 'Top credit consumers', icon: Crown, color: '#f59e0b' },
  { key: 'atRisk', label: 'At Risk Churn', desc: 'Active sub, no runs in 14d', icon: AlertTriangle, color: '#ef4444' },
  { key: 'sleepers', label: 'Sleepers', desc: 'Paying, <10% usage', icon: Moon, color: '#8b5cf6' },
  { key: 'upgradeCandidates', label: 'Upgrade Candidates', desc: '>90% credit usage', icon: TrendingUp, color: '#22c55e' },
  { key: 'newWithoutSub', label: 'New (No Sub)', desc: 'Last 7 days, no subscription', icon: UserPlus, color: '#3388ff' },
];

export default function SegmentsPage() {
  const { data, loading, error, refresh } = useAnalyticsNoRange<any>('segments');
  const [active, setActive] = useState('powerUsers');

  const segment = SEGMENTS.find(s => s.key === active)!;
  const rows = data?.[active] || [];

  const columns: Record<string, any[]> = {
    powerUsers: [
      { key: 'email', label: 'Email' },
      { key: 'plan', label: 'Plan' },
      { key: 'credits_used_this_period', label: 'Credits Used', align: 'right', render: (v: number) => (v ?? 0).toLocaleString() },
      { key: 'period_credits_total', label: 'Total', align: 'right', render: (v: number) => (v ?? 0).toLocaleString() },
    ],
    atRisk: [
      { key: 'email', label: 'Email' },
      { key: 'plan', label: 'Plan' },
      { key: 'sub_date', label: 'Sub Since', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
      { key: 'last_run', label: 'Last Run', render: (v: string) => v ? new Date(v).toLocaleDateString() : 'Never' },
    ],
    sleepers: [
      { key: 'email', label: 'Email' },
      { key: 'plan', label: 'Plan' },
      { key: 'credits_remaining', label: 'Remaining', align: 'right', render: (v: number) => (v ?? 0).toLocaleString() },
      { key: 'credits_used_this_period', label: 'Used', align: 'right', render: (v: number) => (v ?? 0).toLocaleString() },
      { key: 'period_credits_total', label: 'Total', align: 'right', render: (v: number) => (v ?? 0).toLocaleString() },
    ],
    upgradeCandidates: [
      { key: 'email', label: 'Email' },
      { key: 'plan', label: 'Plan' },
      { key: 'credits_used_this_period', label: 'Used', align: 'right', render: (v: number) => (v ?? 0).toLocaleString() },
      { key: 'period_credits_total', label: 'Total', align: 'right', render: (v: number) => (v ?? 0).toLocaleString() },
    ],
    newWithoutSub: [
      { key: 'email', label: 'Email' },
      { key: 'name', label: 'Name' },
      { key: 'source', label: 'Source' },
      { key: 'created_at', label: 'Joined', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    ],
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Customer Segments</h1>
          <p className="text-sm text-[#9b9bb0] mt-1">Automated user segmentation</p>
        </div>
        <button onClick={refresh} className="px-4 py-2 rounded-xl bg-white/[0.04] text-sm text-[#9b9bb0] hover:bg-white/[0.07] transition-colors">Refresh</button>
      </div>

      {loading && !data ? <LoadingState /> : error ? <ErrorState message={error} onRetry={refresh} /> : data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {SEGMENTS.map(s => {
              const Icon = s.icon;
              const count = data[s.key]?.length || 0;
              return (
                <button key={s.key} onClick={() => setActive(s.key)}
                  className={`kpi-card text-left transition-all ${active === s.key ? 'ring-1 ring-[#3388ff]' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                    <span className="text-xs font-semibold text-[#9b9bb0]">{s.label}</span>
                  </div>
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-[10px] text-[#9b9bb0] mt-1">{s.desc}</p>
                </button>
              );
            })}
          </div>

          <ChartCard title={`${segment.label} — ${rows.length} users`}>
            <DataTable
              columns={columns[active] || []}
              data={rows}
              exportFilename={`segment-${active}`}
            />
          </ChartCard>
        </>
      )}
    </>
  );
}

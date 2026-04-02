'use client';

import { KPICard } from '@/app/components/KPICard';
import { ChartCard } from '@/app/components/ChartCard';
import { DataTable } from '@/app/components/DataTable';
import { useAnalyticsNoRange } from '@/app/hooks/useAnalytics';
import { LoadingState, ErrorState } from '@/app/components/PageHeader';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export default function AbusePage() {
  const { data, loading, error, refresh } = useAnalyticsNoRange<any>('abuse');

  const highRisk = data?.suspiciousIPs?.filter((r: any) => r.account_count >= 3).length || 0;

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Free Trial Abuse Detection</h1>
          <p className="text-sm text-[#9b9bb0] mt-1">IPs with multiple accounts and free trials</p>
        </div>
        <button onClick={refresh} className="px-4 py-2 rounded-xl bg-white/[0.04] text-sm text-[#9b9bb0] hover:bg-white/[0.07] transition-colors">Refresh</button>
      </div>

      {loading && !data ? <LoadingState /> : error ? <ErrorState message={error} onRetry={refresh} /> : data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <KPICard title="Suspicious IPs (2+)" value={data.suspiciousIPs?.length || 0} icon={<ShieldAlert className="w-5 h-5" />} color="#f59e0b" />
            <KPICard title="High Risk (3+)" value={highRisk} icon={<AlertTriangle className="w-5 h-5" />} color="#ef4444" />
            <KPICard title="Total Accounts Involved" value={data.suspiciousIPs?.reduce((s: number, r: any) => s + r.account_count, 0) || 0} color="#8b5cf6" />
          </div>

          <ChartCard title="Suspicious IPs">
            <DataTable
              columns={[
                { key: 'ip', label: 'IP Address', render: (v: string) => <span className="font-mono">{v}</span> },
                { key: 'account_count', label: 'Accounts', align: 'right', render: (v: number) => (
                  <span className={`font-semibold ${v >= 3 ? 'text-[#ef4444]' : 'text-[#f59e0b]'}`}>{v}</span>
                )},
                { key: 'free_trials', label: 'Free Trials', align: 'right', render: (v: number) => (
                  <span className={`font-semibold ${v >= 3 ? 'text-[#ef4444]' : v >= 2 ? 'text-[#f59e0b]' : 'text-white'}`}>{v}</span>
                )},
                { key: 'emails', label: 'Emails', render: (v: string[]) => (
                  <div className="flex flex-wrap gap-1">{(v || []).map(e => (
                    <span key={e} className="px-2 py-0.5 rounded-full text-[10px] bg-white/[0.06] text-[#9b9bb0]">{e}</span>
                  ))}</div>
                )},
              ]}
              data={data.suspiciousIPs || []}
              exportFilename="suspicious-ips"
            />
          </ChartCard>
        </>
      )}
    </>
  );
}

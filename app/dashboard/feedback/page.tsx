'use client';

import { KPICard } from '@/app/components/KPICard';
import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { ChartCard } from '@/app/components/ChartCard';
import { useDateRange, useAnalytics } from '@/app/hooks/useAnalytics';
import { MessageSquare } from 'lucide-react';

export default function FeedbackPage() {
  const { range, setRange } = useDateRange();
  const { data, loading, error, refresh } = useAnalytics<any>('feedback', range);

  if (error) return <><PageHeader title="Feedback" range={range} onRangeChange={setRange} /><ErrorState message={error} onRetry={refresh} /></>;

  return (
    <>
      <PageHeader title="User Feedback" subtitle="Messages from the feedback button" range={range} onRangeChange={setRange} onRefresh={refresh} loading={loading} />

      {loading && !data ? <LoadingState /> : data && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <KPICard title="Total Feedback" value={data.feedback?.length || 0} icon={<MessageSquare className="w-5 h-5" />} color="#3388ff" />
          </div>

          <ChartCard title="Recent Feedback">
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {data.feedback?.length === 0 && <p className="text-sm text-[#9b9bb0] py-8 text-center">No feedback yet</p>}
              {data.feedback?.map((f: any) => (
                <div key={f.id} className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{f.email || f.name || 'Anonymous'}</span>
                    <span className="text-xs text-[#9b9bb0]">{new Date(f.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-[#9b9bb0] leading-relaxed">{f.message}</p>
                  {f.page_url && <p className="text-xs text-[#9b9bb0]/50 mt-2 font-mono">{f.page_url}</p>}
                </div>
              ))}
            </div>
          </ChartCard>
        </>
      )}
    </>
  );
}

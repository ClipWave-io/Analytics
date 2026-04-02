'use client';

import { KPICard } from '@/app/components/KPICard';
import { ChartCard } from '@/app/components/ChartCard';
import { useAnalyticsNoRange } from '@/app/hooks/useAnalytics';
import { LoadingState, ErrorState } from '@/app/components/PageHeader';
import { Gauge, Clock, Zap } from 'lucide-react';

export default function VelocityPage() {
  const { data, loading, error, refresh } = useAnalyticsNoRange<any>('velocity');

  const formatHours = (h: number) => {
    if (h < 1) return `${Math.round(h * 60)} min`;
    if (h < 24) return `${h.toFixed(1)} hrs`;
    return `${(h / 24).toFixed(1)} days`;
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Velocity Metrics</h1>
          <p className="text-sm text-[#9b9bb0] mt-1">Time-to-value metrics</p>
        </div>
        <button onClick={refresh} className="px-4 py-2 rounded-xl bg-white/[0.04] text-sm text-[#9b9bb0] hover:bg-white/[0.07] transition-colors">Refresh</button>
      </div>

      {loading && !data ? <LoadingState /> : error ? <ErrorState message={error} onRetry={refresh} /> : data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card flex flex-col items-center justify-center py-12 text-center">
            <Clock className="w-10 h-10 text-[#3388ff] mb-4" />
            <p className="text-sm text-[#9b9bb0] mb-2">Time to First Video</p>
            <p className="text-4xl font-bold">{formatHours(data.avgHoursToFirstVideo)}</p>
            <p className="text-xs text-[#9b9bb0] mt-2">Average time from registration to first pipeline run</p>
          </div>
          <div className="card flex flex-col items-center justify-center py-12 text-center">
            <Zap className="w-10 h-10 text-[#22c55e] mb-4" />
            <p className="text-sm text-[#9b9bb0] mb-2">Time to Subscription</p>
            <p className="text-4xl font-bold">{formatHours(data.avgHoursToSubscription)}</p>
            <p className="text-xs text-[#9b9bb0] mt-2">Average time from registration to first paid plan</p>
          </div>
        </div>
      )}
    </>
  );
}

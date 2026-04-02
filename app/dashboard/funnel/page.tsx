'use client';

import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { ChartCard } from '@/app/components/ChartCard';
import { useDateRange, useAnalytics } from '@/app/hooks/useAnalytics';

const ONBOARDING_STEPS = [
  { key: 'onboarding_welcome_shown', label: 'Welcome Shown', color: '#f97316' },
  { key: 'onboarding_use_case_shown', label: 'Use Case Step', color: '#fb923c' },
  { key: 'onboarding_use_case_selected', label: 'Use Case Selected', color: '#fbbf24' },
  { key: 'onboarding_method_shown', label: 'Method Step', color: '#a3e635' },
  { key: 'onboarding_method_selected', label: 'Method Selected', color: '#34d399' },
  { key: 'onboarding_final_shown', label: 'Final Screen', color: '#22d3ee' },
  { key: 'onboarding_completed', label: 'Completed', color: '#3388ff' },
];

export default function FunnelPage() {
  const { range, setRange } = useDateRange();
  const { data, loading, error, refresh } = useAnalytics<any>('funnel', range);

  if (error) return <><PageHeader title="Conversion Funnel" range={range} onRangeChange={setRange} /><ErrorState message={error} onRetry={refresh} /></>;

  return (
    <>
      <PageHeader title="Conversion Funnel" subtitle="From visit to payment" range={range} onRangeChange={setRange} onRefresh={refresh} loading={loading} />

      {loading && !data ? <LoadingState /> : data && (
        <>
          {/* Main funnel */}
          <ChartCard title="Main Funnel" className="mb-8">
            <FunnelViz steps={[
              { label: 'Page Visits', count: data.mainFunnel.visits, color: '#8b5cf6' },
              { label: 'Registrations', count: data.mainFunnel.registrations, color: '#3388ff' },
              { label: 'First Video', count: data.mainFunnel.firstVideo, color: '#22c55e' },
              { label: 'Subscriptions', count: data.mainFunnel.subscriptions, color: '#f59e0b' },
            ]} />
          </ChartCard>

          {/* Onboarding funnel */}
          <ChartCard title="Onboarding Funnel">
            <FunnelViz steps={ONBOARDING_STEPS.map(s => {
              const found = data.onboardingFunnel.find((r: any) => r.event === s.key);
              return { label: s.label, count: found?.count || 0, color: s.color };
            })} />
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
        const convFromFirst = steps[0].count > 0 ? ((step.count / steps[0].count) * 100) : 0;
        return (
          <div key={step.label} className="flex items-center gap-3">
            <span className="text-xs text-[#9b9bb0] w-36 shrink-0 text-right truncate">{step.label}</span>
            <div className="flex-1 bg-white/[0.04] rounded-full h-8 overflow-hidden relative">
              <div
                className="h-full rounded-full flex items-center px-3 transition-all duration-500"
                style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: step.color }}
              >
                <span className="text-white text-xs font-bold whitespace-nowrap">{step.count.toLocaleString()}</span>
              </div>
            </div>
            <div className="w-20 shrink-0 text-right">
              {i > 0 && (
                <span className={`text-xs font-semibold ${dropoff > 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                  {dropoff > 0 ? `-${dropoff.toFixed(0)}%` : '0%'}
                </span>
              )}
            </div>
            <span className="w-12 shrink-0 text-right text-[10px] text-[#9b9bb0]">
              {convFromFirst.toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

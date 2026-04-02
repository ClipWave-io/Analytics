'use client';

import { ChartCard } from '@/app/components/ChartCard';
import { useAnalyticsNoRange } from '@/app/hooks/useAnalytics';
import { LoadingState, ErrorState } from '@/app/components/PageHeader';

export default function CohortsPage() {
  const { data, loading, error, refresh } = useAnalyticsNoRange<any>('cohorts');

  // Build cohort matrix
  const cohortMap: Record<string, Record<string, number>> = {};
  const cohortSizes: Record<string, number> = {};

  if (data?.cohorts) {
    for (const row of data.cohorts) {
      if (!row.cohort_month || !row.active_month) continue;
      cohortSizes[row.cohort_month] = row.cohort_size;
      if (!cohortMap[row.cohort_month]) cohortMap[row.cohort_month] = {};
      cohortMap[row.cohort_month][row.active_month] = row.active_users;
    }
  }

  const cohortMonths = Object.keys(cohortMap).sort();
  const allMonths = [...new Set(cohortMonths.flatMap(c => Object.keys(cohortMap[c])))].sort();

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Cohort Analysis</h1>
          <p className="text-sm text-[#9b9bb0] mt-1">User retention by registration month</p>
        </div>
        <button onClick={refresh} className="px-4 py-2 rounded-xl bg-white/[0.04] text-sm text-[#9b9bb0] hover:bg-white/[0.07] transition-colors">Refresh</button>
      </div>

      {loading && !data ? <LoadingState /> : error ? <ErrorState message={error} onRetry={refresh} /> : data && (
        <ChartCard title="Retention Matrix">
          <div className="table-container">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="py-2 px-3 text-left text-[#9b9bb0] font-semibold sticky left-0 bg-[rgba(5,5,16,0.95)] z-10">Cohort</th>
                  <th className="py-2 px-3 text-right text-[#9b9bb0] font-semibold">Size</th>
                  {cohortMonths.length > 0 && allMonths.map(m => (
                    <th key={m} className="py-2 px-3 text-center text-[#9b9bb0] font-semibold whitespace-nowrap">{m.slice(0, 7)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortMonths.map(cohort => {
                  const size = cohortSizes[cohort] || 1;
                  return (
                    <tr key={cohort} className="border-t border-white/[0.04]">
                      <td className="py-2 px-3 text-[#9b9bb0] font-mono sticky left-0 bg-[rgba(5,5,16,0.95)] z-10">{cohort.slice(0, 7)}</td>
                      <td className="py-2 px-3 text-right text-white font-semibold">{size}</td>
                      {allMonths.map(month => {
                        const active = cohortMap[cohort]?.[month] || 0;
                        const pct = size > 0 ? (active / size) * 100 : 0;
                        const intensity = Math.min(pct / 100, 1);
                        const bg = month < cohort ? 'transparent'
                          : `rgba(51, 136, 255, ${intensity * 0.6})`;
                        return (
                          <td key={month} className="py-2 px-3 text-center" style={{ backgroundColor: bg }}>
                            {month >= cohort && active > 0 ? (
                              <span className="text-white font-semibold">{pct.toFixed(0)}%</span>
                            ) : month >= cohort ? (
                              <span className="text-[#9b9bb0]/30">0</span>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {cohortMonths.length === 0 && <p className="text-sm text-[#9b9bb0] py-8 text-center">No cohort data yet</p>}
        </ChartCard>
      )}
    </>
  );
}

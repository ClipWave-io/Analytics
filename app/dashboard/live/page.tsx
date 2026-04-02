'use client';

import { useState, useEffect } from 'react';
import { KPICard } from '@/app/components/KPICard';
import { ChartCard } from '@/app/components/ChartCard';
import { Radio, Users, Eye } from 'lucide-react';

export default function LivePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/analytics/live');
      if (res.ok) setData(await res.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] pulse-dot" />
            Live View
          </h1>
          <p className="text-sm text-[#9b9bb0] mt-1">Real-time activity on ClipWave</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="accent-[#3388ff]" />
          <span className="text-xs text-[#9b9bb0]">Auto-refresh (15s)</span>
        </label>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <KPICard title="Active Now" value={data.activeUsers} icon={<Users className="w-5 h-5" />} color="#22c55e" />
            <KPICard title="Events (50 latest)" value={data.recentEvents?.length || 0} icon={<Radio className="w-5 h-5" />} color="#3388ff" />
            <KPICard title="Active Pages" value={data.activePaths?.length || 0} icon={<Eye className="w-5 h-5" />} color="#8b5cf6" />
          </div>

          {data.activePaths?.length > 0 && (
            <ChartCard title="Active Pages (last 5 min)" className="mb-8">
              <div className="space-y-2">
                {data.activePaths.map((p: any) => (
                  <div key={p.path} className="flex items-center justify-between px-3 py-2 bg-white/[0.02] rounded-lg">
                    <span className="text-sm text-[#9b9bb0] font-mono truncate">{p.path || '/'}</span>
                    <span className="text-sm font-semibold text-white">{p.count}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}

          <ChartCard title="Event Stream">
            <div className="max-h-[500px] overflow-y-auto space-y-1">
              {data.recentEvents?.map((ev: any) => (
                <div key={ev.id} className="flex items-center gap-3 px-3 py-2 bg-white/[0.02] rounded-lg text-xs hover:bg-white/[0.04] transition-colors">
                  <span className="text-[#9b9bb0] font-mono w-32 shrink-0">{new Date(ev.created_at).toLocaleTimeString()}</span>
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${
                    ev.event === 'link_click' ? 'bg-[#3388ff]/10 text-[#3388ff]' :
                    ev.event === 'page_visit' ? 'bg-[#8b5cf6]/10 text-[#8b5cf6]' :
                    ev.event === 'dashboard_visit' ? 'bg-[#22c55e]/10 text-[#22c55e]' :
                    'bg-white/[0.06] text-[#9b9bb0]'
                  }`}>{ev.event}</span>
                  <span className="text-[#9b9bb0] truncate flex-1">{ev.source || '-'}</span>
                  <span className="text-[#9b9bb0] font-mono">{ev.metadata?.path || '-'}</span>
                  <span className="text-[#9b9bb0]/50 font-mono w-28 shrink-0 text-right">{ev.ip || '-'}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#3388ff]/30 border-t-[#3388ff] rounded-full animate-spin" />
        </div>
      )}
    </>
  );
}

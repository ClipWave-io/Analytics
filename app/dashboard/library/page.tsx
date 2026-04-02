'use client';

import { useState, useEffect, useCallback } from 'react';
import { LoadingState } from '@/app/components/PageHeader';
import { Film, Image, Video, User, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

interface RunItem {
  runId: string;
  userId: number;
  email: string | null;
  username: string | null;
  status: string;
  source: string;
  description: string;
  format: string;
  duration: string;
  createdAt: string;
  hasFiles: boolean;
  keyframes: string[];
  scenes: string[];
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-500/15 text-emerald-400',
  running: 'bg-blue-500/15 text-blue-400',
  failed: 'bg-red-500/15 text-red-400',
  stopped: 'bg-yellow-500/15 text-yellow-400',
};

export default function LibraryPage() {
  const [data, setData] = useState<RunItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/library');
      if (res.ok) setData(await res.json());
    } catch { /* */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggle = (runId: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(runId) ? next.delete(runId) : next.add(runId);
      return next;
    });
  };

  const filtered = filter === 'all' ? data : data.filter(r => r.status === filter);
  const counts = {
    all: data.length,
    completed: data.filter(r => r.status === 'completed').length,
    running: data.filter(r => r.status === 'running').length,
    failed: data.filter(r => r.status === 'failed').length,
    stopped: data.filter(r => r.status === 'stopped').length,
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Library</h1>
          <p className="text-sm text-[#9b9bb0]">All generated keyframes & clips</p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#9b9bb0] hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.entries(counts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              filter === key ? 'bg-white/[0.08] text-white' : 'bg-white/[0.03] text-[#9b9bb0] hover:text-white'
            }`}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)} ({count})
          </button>
        ))}
      </div>

      {loading ? <LoadingState /> : (
        <div className="space-y-3">
          {filtered.map(run => {
            const isOpen = expanded.has(run.runId);
            return (
              <div key={run.runId} className="bg-[#0a0a1a] rounded-2xl border border-white/[0.06] overflow-hidden">
                {/* Run header */}
                <button
                  onClick={() => toggle(run.runId)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
                    <Film className="w-5 h-5 text-[#9b9bb0]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[run.status] || 'bg-white/10 text-white'}`}>
                        {run.status}
                      </span>
                      <span className="text-[10px] text-[#9b9bb0] font-mono">{run.runId.slice(0, 8)}</span>
                      <span className="text-[10px] text-[#9b9bb0]">{run.format} &middot; {run.duration}</span>
                      {run.hasFiles && (
                        <span className="flex items-center gap-1 text-[10px] text-[#9b9bb0]">
                          <Image className="w-3 h-3" />{run.keyframes.length}
                          <Video className="w-3 h-3 ml-1" />{run.scenes.length}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white truncate">{run.description || 'No description'}</p>
                  </div>
                  <div className="text-right shrink-0 mr-2">
                    <div className="flex items-center gap-1 text-xs text-[#9b9bb0]">
                      <User className="w-3 h-3" />
                      {run.email || `User #${run.userId}`}
                    </div>
                    <p className="text-[10px] text-[#9b9bb0] mt-0.5">
                      {new Date(run.createdAt).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-[#9b9bb0] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#9b9bb0] shrink-0" />}
                </button>

                {/* Expanded content */}
                {isOpen && run.hasFiles && (
                  <div className="px-4 pb-4 border-t border-white/[0.04]">
                    {/* Keyframes */}
                    {run.keyframes.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-[#9b9bb0] mb-2 flex items-center gap-1"><Image className="w-3 h-3" /> Keyframes</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {run.keyframes.map(kf => (
                            <a
                              key={kf}
                              href={`/api/library/file?run=${run.runId}&type=keyframe&file=${kf}`}
                              target="_blank"
                              rel="noopener"
                              className="block rounded-xl overflow-hidden border border-white/[0.06] hover:border-white/[0.15] transition-colors"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`/api/library/file?run=${run.runId}&type=keyframe&file=${kf}`}
                                alt={kf}
                                className="w-full aspect-[9/16] object-cover bg-black"
                                loading="lazy"
                              />
                              <p className="text-[10px] text-[#9b9bb0] text-center py-1">{kf.replace('.png', '')}</p>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Scene clips */}
                    {run.scenes.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-[#9b9bb0] mb-2 flex items-center gap-1"><Video className="w-3 h-3" /> Scene Clips</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {run.scenes.map(sc => (
                            <div key={sc} className="rounded-xl overflow-hidden border border-white/[0.06]">
                              <video
                                src={`/api/library/file?run=${run.runId}&type=scene&file=${sc}`}
                                controls
                                preload="metadata"
                                className="w-full aspect-[9/16] bg-black"
                              />
                              <p className="text-[10px] text-[#9b9bb0] text-center py-1">{sc.replace('.mp4', '')}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {run.keyframes.length === 0 && run.scenes.length === 0 && (
                      <p className="text-sm text-[#9b9bb0] text-center py-8">No files found in storage</p>
                    )}
                  </div>
                )}

                {isOpen && !run.hasFiles && (
                  <div className="px-4 pb-4 border-t border-white/[0.04]">
                    <p className="text-sm text-[#9b9bb0] text-center py-8">No files in storage for this run</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

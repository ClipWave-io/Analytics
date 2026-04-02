'use client';

import { DateFilter, DateRange } from './DateFilter';
import { RefreshCw } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
  compare?: boolean;
  onCompareChange?: (enabled: boolean) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function PageHeader({ title, subtitle, range, onRangeChange, compare, onCompareChange, onRefresh, loading }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-[#9b9bb0] mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {loading && <span className="text-xs text-[#9b9bb0] animate-pulse">Loading...</span>}
        {onRefresh && (
          <button onClick={onRefresh} className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#9b9bb0] hover:bg-white/[0.07] hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
        <DateFilter value={range} onChange={onRangeChange} compare={compare} onCompareChange={onCompareChange} />
      </div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#3388ff]/30 border-t-[#3388ff] rounded-full animate-spin" />
        <span className="text-sm text-[#9b9bb0]">Loading data...</span>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-[#ef4444] text-sm">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="px-4 py-2 rounded-xl bg-white/[0.04] text-sm text-[#9b9bb0] hover:bg-white/[0.07] transition-colors">
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-sm text-[#9b9bb0]">{message}</p>
    </div>
  );
}

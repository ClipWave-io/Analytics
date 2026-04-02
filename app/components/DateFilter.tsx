'use client';

import { useState, useCallback } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export type DateRange = {
  from: string;
  to: string;
  label: string;
};

const QUICK_RANGES = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1, offset: true },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: 'This month', days: -1 },
  { label: 'Last month', days: -2 },
  { label: '90 days', days: 90 },
  { label: 'Year', days: 365 },
  { label: 'All time', days: -99 },
];

function getRange(item: typeof QUICK_RANGES[0]): DateRange {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  if (item.days === -99) {
    return { from: '2024-01-01', to: to.toISOString().slice(0, 10), label: item.label };
  }
  if (item.days === -1) {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10), label: item.label };
  }
  if (item.days === -2) {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: from.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10), label: item.label };
  }
  if (item.offset) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const d = yesterday.toISOString().slice(0, 10);
    return { from: d, to: d, label: item.label };
  }
  if (item.days === 0) {
    const d = now.toISOString().slice(0, 10);
    return { from: d, to: d, label: item.label };
  }

  const from = new Date(now);
  from.setDate(from.getDate() - item.days);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10), label: item.label };
}

interface DateFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  compare?: boolean;
  onCompareChange?: (enabled: boolean) => void;
}

export function DateFilter({ value, onChange, compare, onCompareChange }: DateFilterProps) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo] = useState(value.to);

  const handleQuick = useCallback((item: typeof QUICK_RANGES[0]) => {
    onChange(getRange(item));
    setOpen(false);
  }, [onChange]);

  const handleCustom = useCallback(() => {
    onChange({ from: customFrom, to: customTo, label: `${customFrom} — ${customTo}` });
    setOpen(false);
  }, [customFrom, customTo, onChange]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-[#ededf0] hover:bg-white/[0.07] transition-colors"
      >
        <Calendar className="w-4 h-4 text-[#9b9bb0]" />
        <span>{value.label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-[#9b9bb0]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-[#0c0e1a] border border-white/[0.08] rounded-2xl p-4 shadow-2xl w-80">
            <p className="text-xs text-[#9b9bb0] font-medium uppercase tracking-wider mb-3">Quick ranges</p>
            <div className="grid grid-cols-3 gap-1.5 mb-4">
              {QUICK_RANGES.map(item => (
                <button
                  key={item.label}
                  onClick={() => handleQuick(item)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    value.label === item.label
                      ? 'bg-[#3388ff] text-white'
                      : 'bg-white/[0.04] text-[#9b9bb0] hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-[#9b9bb0] font-medium uppercase tracking-wider mb-3">Custom range</p>
            <div className="flex gap-2 mb-3">
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white [color-scheme:dark]"
              />
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white [color-scheme:dark]"
              />
            </div>
            <button
              onClick={handleCustom}
              className="w-full py-2 rounded-lg bg-[#3388ff] text-white text-sm font-semibold hover:bg-[#2266dd] transition-colors"
            >
              Apply
            </button>

            {onCompareChange && (
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={compare}
                  onChange={e => onCompareChange(e.target.checked)}
                  className="rounded accent-[#3388ff]"
                />
                <span className="text-xs text-[#9b9bb0]">Compare with previous period</span>
              </label>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function getDefaultRange(): DateRange {
  return getRange(QUICK_RANGES[3]); // 30 days
}

export function getPreviousPeriod(range: DateRange): DateRange {
  const from = new Date(range.from);
  const to = new Date(range.to);
  const diff = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - diff);
  return {
    from: prevFrom.toISOString().slice(0, 10),
    to: prevTo.toISOString().slice(0, 10),
    label: 'Previous period',
  };
}

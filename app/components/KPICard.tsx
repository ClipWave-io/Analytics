'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: string;
  prefix?: string;
  suffix?: string;
}

export function KPICard({ title, value, change, changeLabel, icon, color, prefix, suffix }: KPICardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change === undefined || change === 0;

  return (
    <div className="kpi-card group">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[#9b9bb0] text-sm font-medium flex items-center gap-2">
          {color && <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />}
          {title}
        </p>
        {icon && <span className="text-[#9b9bb0] opacity-50 group-hover:opacity-80 transition-opacity">{icon}</span>}
      </div>
      <p className="text-2xl lg:text-3xl font-bold tracking-tight">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>
      {change !== undefined && (
        <div className="flex items-center gap-1.5 mt-2">
          {isPositive && <TrendingUp className="w-3.5 h-3.5 text-[#22c55e]" />}
          {isNegative && <TrendingDown className="w-3.5 h-3.5 text-[#ef4444]" />}
          {isNeutral && <Minus className="w-3.5 h-3.5 text-[#9b9bb0]" />}
          <span className={`text-xs font-semibold ${isPositive ? 'text-[#22c55e]' : isNegative ? 'text-[#ef4444]' : 'text-[#9b9bb0]'}`}>
            {isPositive ? '+' : ''}{change.toFixed(1)}%
          </span>
          {changeLabel && <span className="text-xs text-[#9b9bb0]">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}

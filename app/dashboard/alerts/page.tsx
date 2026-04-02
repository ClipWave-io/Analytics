'use client';

import { ChartCard } from '@/app/components/ChartCard';
import { Bell, AlertTriangle, DollarSign, ShieldAlert, CreditCard } from 'lucide-react';

const ALERT_RULES = [
  { icon: DollarSign, label: 'MRR Drop > 10%', desc: 'Notify when MRR drops more than 10% vs previous month', color: '#ef4444' },
  { icon: AlertTriangle, label: 'Churn Spike', desc: 'More than 3 cancellations in a single day', color: '#f59e0b' },
  { icon: AlertTriangle, label: 'Pipeline Failure Rate > 5%', desc: 'Error rate exceeds 5% of total runs', color: '#ef4444' },
  { icon: ShieldAlert, label: 'Free Trial Abuse', desc: 'New IP detected with 3+ accounts', color: '#8b5cf6' },
  { icon: CreditCard, label: 'Payment Failure', desc: 'Stripe payment failure detected', color: '#f59e0b' },
  { icon: DollarSign, label: 'Power User Low Credits', desc: 'Active user running low on credits', color: '#3388ff' },
];

export default function AlertsPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Alerts & Notifications</h1>
        <p className="text-sm text-[#9b9bb0] mt-1">Configure automated alerts via Telegram</p>
      </div>

      <ChartCard title="Alert Rules">
        <div className="space-y-3">
          {ALERT_RULES.map((rule, i) => {
            const Icon = rule.icon;
            return (
              <div key={i} className="flex items-center gap-4 px-4 py-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${rule.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: rule.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{rule.label}</p>
                  <p className="text-xs text-[#9b9bb0]">{rule.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9b9bb0] bg-white/[0.04] px-3 py-1 rounded-full">Telegram</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-white/[0.1] peer-checked:bg-[#3388ff] rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-[#9b9bb0] mt-4">Alerts require TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables configured on the main site.</p>
      </ChartCard>
    </>
  );
}

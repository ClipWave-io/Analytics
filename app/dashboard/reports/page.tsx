'use client';

import { ChartCard } from '@/app/components/ChartCard';
import { Download, FileText, Mail } from 'lucide-react';

export default function ReportsPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Reports & Export</h1>
        <p className="text-sm text-[#9b9bb0] mt-1">Export data and schedule automated reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ChartCard title="Manual Export">
          <div className="space-y-3">
            <p className="text-sm text-[#9b9bb0]">Every table in the dashboard has a CSV export button. Navigate to any section and click the download icon to export.</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {['Subscribers', 'Users', 'Pipeline Runs', 'Credit Utilization', 'Top Pages', 'Failed Runs'].map(item => (
                <span key={item} className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-xs text-[#9b9bb0] flex items-center gap-1.5">
                  <Download className="w-3 h-3" /> {item}
                </span>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Automated Reports">
          <div className="space-y-4">
            <div className="flex items-center gap-4 px-4 py-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
              <FileText className="w-5 h-5 text-[#3388ff]" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Weekly Digest</p>
                <p className="text-xs text-[#9b9bb0]">Every Monday via Telegram: MRR, new users, churn, video runs</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-9 h-5 bg-white/[0.1] peer-checked:bg-[#3388ff] rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
              </label>
            </div>
            <div className="flex items-center gap-4 px-4 py-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
              <Mail className="w-5 h-5 text-[#8b5cf6]" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Monthly Report</p>
                <p className="text-xs text-[#9b9bb0]">1st of each month: full KPI summary with period comparison</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-9 h-5 bg-white/[0.1] peer-checked:bg-[#3388ff] rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
              </label>
            </div>
          </div>
        </ChartCard>
      </div>
    </>
  );
}

'use client';

import { PageHeader, LoadingState, ErrorState } from '@/app/components/PageHeader';
import { ChartCard } from '@/app/components/ChartCard';
import { useDateRange, useAnalytics } from '@/app/hooks/useAnalytics';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';

const DEVICE_COLORS = ['#3388ff', '#22c55e', '#f59e0b'];
const BROWSER_COLORS = ['#3388ff', '#ef4444', '#f59e0b', '#8b5cf6', '#6b7280'];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c0e1a] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-white font-semibold">{payload[0].name}: {payload[0].value?.toLocaleString()}</p>
    </div>
  );
};

export default function DevicesPage() {
  const { range, setRange } = useDateRange();
  const { data, loading, error, refresh } = useAnalytics<any>('devices', range);

  const devicePie = data ? Object.entries(data.devices || {}).map(([name, value]) => ({ name, value })) : [];
  const browserPie = data ? Object.entries(data.browsers || {}).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([name, value]) => ({ name, value })) : [];
  const osPie = data ? Object.entries(data.oses || {}).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([name, value]) => ({ name, value })) : [];

  if (error) return <><PageHeader title="Devices" range={range} onRangeChange={setRange} /><ErrorState message={error} onRetry={refresh} /></>;

  return (
    <>
      <PageHeader title="Devices & Browsers" subtitle="User agent analytics" range={range} onRangeChange={setRange} onRefresh={refresh} loading={loading} />

      {loading && !data ? <LoadingState /> : data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ChartCard title="Device Type">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={devicePie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                  {devicePie.map((_, i) => <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Browser">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={browserPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                  {browserPie.map((_, i) => <Cell key={i} fill={BROWSER_COLORS[i % BROWSER_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Operating System">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={osPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                  {osPie.map((_, i) => <Cell key={i} fill={BROWSER_COLORS[i % BROWSER_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </>
  );
}

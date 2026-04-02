'use client';

import { PageHeader } from '@/app/components/PageHeader';
import { ChartCard } from '@/app/components/ChartCard';
import { useDateRange } from '@/app/hooks/useAnalytics';
import { CreditCard } from 'lucide-react';

export default function CheckoutPage() {
  const { range, setRange } = useDateRange();

  return (
    <>
      <PageHeader title="Checkout Funnel" subtitle="Stripe checkout analytics" range={range} onRangeChange={setRange} />
      <ChartCard title="Checkout Analytics">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CreditCard className="w-12 h-12 text-[#9b9bb0]/30 mb-4" />
          <p className="text-sm text-[#9b9bb0] mb-2">Requires Stripe API integration</p>
          <p className="text-xs text-[#9b9bb0]/60">Add your STRIPE_SECRET_KEY to .env to enable checkout funnel tracking</p>
        </div>
      </ChartCard>
    </>
  );
}

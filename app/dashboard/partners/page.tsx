'use client';

import Link from 'next/link';
import { PageHeader } from '@/app/components/PageHeader';
import { useDateRange } from '@/app/hooks/useAnalytics';
import { Handshake, ArrowRight } from 'lucide-react';

const PARTNERS = [
  {
    slug: 'gilam',
    name: 'Gilam',
    description: 'Referral link + GPT integration (gilam, AIResearchPlus)',
    color: '#8b5cf6',
  },
];

export default function PartnersHubPage() {
  const { range, setRange } = useDateRange();
  return (
    <>
      <PageHeader
        title="Partners Hub"
        subtitle="Admin view of each partner's dashboard — same data they see"
        range={range}
        onRangeChange={setRange}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PARTNERS.map((p) => (
          <Link
            key={p.slug}
            href={`/dashboard/partners/${p.slug}`}
            className="card group hover:border-white/[0.15] transition-colors no-underline"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${p.color}15` }}
              >
                <Handshake className="w-5 h-5" style={{ color: p.color }} />
              </div>
              <ArrowRight className="w-4 h-4 text-[#9b9bb0] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-bold mb-1">{p.name}</h3>
            <p className="text-xs text-[#9b9bb0]">{p.description}</p>
          </Link>
        ))}
        {PARTNERS.length === 0 && (
          <p className="text-sm text-[#9b9bb0] col-span-full text-center py-16">
            No partners configured yet.
          </p>
        )}
      </div>
    </>
  );
}

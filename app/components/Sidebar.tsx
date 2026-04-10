'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipwaveLogo } from './Logo';
import {
  LayoutDashboard, DollarSign, Users, GitBranch, Zap, Coins,
  TrendingUp, Megaphone, CreditCard, Radio, Globe, ShieldAlert,
  Grid3X3, Heart, BarChart3, ArrowUpDown, UserCheck, Gauge,
  Layers, AlertTriangle, UserSearch, MonitorSmartphone, FileText,
  MessageSquare, Bell, Download, Menu, X, LogOut, Film, Handshake
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    label: 'OVERVIEW',
    items: [
      { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
    ],
  },
  {
    label: 'MONEY',
    items: [
      { href: '/dashboard/revenue', label: 'Revenue & MRR', icon: DollarSign },
      { href: '/dashboard/checkout', label: 'Checkout Funnel', icon: CreditCard },
      { href: '/dashboard/ltv', label: 'Customer LTV', icon: Heart },
      { href: '/dashboard/expansion', label: 'Expansion Revenue', icon: ArrowUpDown },
      { href: '/dashboard/costs', label: 'API Costs', icon: BarChart3 },
      { href: '/dashboard/credits', label: 'Credit Economics', icon: Coins },
    ],
  },
  {
    label: 'GROWTH',
    items: [
      { href: '/dashboard/users', label: 'Users', icon: Users },
      { href: '/dashboard/acquisition', label: 'Acquisition', icon: Megaphone },
      { href: '/dashboard/funnel', label: 'Conversion Funnel', icon: GitBranch },
      { href: '/dashboard/segments', label: 'Customer Segments', icon: UserCheck },
      { href: '/dashboard/geo', label: 'Geolocation', icon: Globe },
    ],
  },
  {
    label: 'PRODUCT',
    items: [
      { href: '/dashboard/usage', label: 'Product Usage', icon: Zap },
      { href: '/dashboard/features', label: 'Feature Adoption', icon: Layers },
      { href: '/dashboard/library', label: 'Library', icon: Film },
      { href: '/dashboard/pages', label: 'Top Pages', icon: FileText },
      { href: '/dashboard/devices', label: 'Devices', icon: MonitorSmartphone },
      { href: '/dashboard/velocity', label: 'Velocity Metrics', icon: Gauge },
    ],
  },
  {
    label: 'RETENTION',
    items: [
      { href: '/dashboard/churn', label: 'Churn Analysis', icon: TrendingUp },
      { href: '/dashboard/cohorts', label: 'Cohort Analysis', icon: Grid3X3 },
      { href: '/dashboard/returning', label: 'New vs Returning', icon: Users },
      { href: '/dashboard/journey', label: 'User Journey', icon: UserSearch },
    ],
  },
  {
    label: 'OPS',
    items: [
      { href: '/dashboard/live', label: 'Live View', icon: Radio },
      { href: '/dashboard/errors', label: 'Error Tracking', icon: AlertTriangle },
      { href: '/dashboard/abuse', label: 'Trial Abuse', icon: ShieldAlert },
      { href: '/dashboard/alerts', label: 'Alerts', icon: Bell },
      { href: '/dashboard/feedback', label: 'Feedback', icon: MessageSquare },
      { href: '/dashboard/reports', label: 'Reports & Export', icon: Download },
    ],
  },
  {
    label: 'PARTNERS',
    items: [
      { href: '/dashboard/partners', label: 'Partners Hub', icon: Handshake },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[rgba(5,5,16,0.97)] border-r border-white/[0.06] z-50 flex flex-col overflow-y-auto transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.06]">
          <Link href="/dashboard" className="flex items-center gap-2.5 no-underline">
            <ClipwaveLogo size={28} />
            <span className="font-extrabold text-[15px] text-white tracking-tight">Clipwave</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3388ff] bg-[#3388ff]/10 px-2 py-0.5 rounded-full">Analytics</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-[#9b9bb0] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-6">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9b9bb0]/60 px-3 mb-2">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium no-underline transition-all duration-150 ${
                        isActive
                          ? 'bg-[#3388ff]/10 text-[#3388ff]'
                          : 'text-[#9b9bb0] hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/[0.06]">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-[#9b9bb0] hover:bg-white/[0.04] hover:text-white transition-all w-full"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

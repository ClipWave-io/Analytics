'use client';

import { useState, useEffect, useCallback } from 'react';
import { DateRange, getDefaultRange } from '@/app/components/DateFilter';

export function useDateRange() {
  const [range, setRange] = useState<DateRange>(getDefaultRange());
  const [compare, setCompare] = useState(false);
  return { range, setRange, compare, setCompare };
}

export function useAnalytics<T>(section: string, range: DateRange, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ from: range.from, to: range.to });
      const res = await fetch(`/api/analytics/${section}?${params}`);
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (err: any) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, range.from, range.to, ...deps]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export function useAnalyticsNoRange<T>(section: string, queryParams?: Record<string, string>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = queryParams ? new URLSearchParams(queryParams) : '';
      const res = await fetch(`/api/analytics/${section}${params ? '?' + params : ''}`);
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (err: any) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [section, queryParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { batchGeolocate } from '@/lib/geo';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const range = url.searchParams.get('range') || '30d';
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const partner = session.role === 'partner' ? session.username : (url.searchParams.get('partner') || 'gilam');

  // Explicit from/to take precedence over range preset
  let dateFilter = '';
  const params: unknown[] = [];
  if (from && to) {
    params.push(from, to);
    dateFilter = `AND created_at >= $2 AND created_at <= $3::date + 1`;
  } else if (range === '7d') {
    dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
  } else if (range === '30d') {
    dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
  }

  const sourceMap: Record<string, string[]> = {
    gilam: ['gilam', 'AIResearchPlus'],
  };
  const sources = sourceMap[partner] || [partner];

  try {
    const [
      uniqueVisitors,
      gptPrefills,
      dailyVisitors,
      dailyGpt,
      bySource,
    ] = await Promise.all([
      // Unique visitors (distinct IPs from link_click)
      query(`
        SELECT COUNT(DISTINCT ip)::INTEGER as count FROM analytics_events
        WHERE source = ANY($1) AND event = 'link_click' AND ip IS NOT NULL ${dateFilter}
      `, [sources, ...params]),

      // GPT prefill events
      query(`
        SELECT COUNT(*)::INTEGER as count FROM analytics_events
        WHERE source = ANY($1) AND event IN ('gpt_prefill', 'gpt_seedance_prefill') ${dateFilter}
      `, [sources, ...params]),

      // Daily unique visitors
      query(`
        SELECT DATE(created_at)::TEXT as day, COUNT(DISTINCT ip)::INTEGER as visitors
        FROM analytics_events
        WHERE source = ANY($1) AND event = 'link_click' AND ip IS NOT NULL ${dateFilter}
        GROUP BY day ORDER BY day
      `, [sources, ...params]),

      // Daily GPT prefills
      query(`
        SELECT DATE(created_at)::TEXT as day, COUNT(*)::INTEGER as gpt
        FROM analytics_events
        WHERE source = ANY($1) AND event IN ('gpt_prefill', 'gpt_seedance_prefill') ${dateFilter}
        GROUP BY day ORDER BY day
      `, [sources, ...params]),

      // Traffic by source (unique IPs from link_click, consistent with KPI)
      query(`
        SELECT source, COUNT(DISTINCT ip)::INTEGER as unique_ips
        FROM analytics_events
        WHERE source = ANY($1) AND event = 'link_click' AND ip IS NOT NULL ${dateFilter}
        GROUP BY source ORDER BY unique_ips DESC
      `, [sources, ...params]),
    ]);

    // First visit per unique IP
    const firstVisits = await query(`
      SELECT DISTINCT ON (ip) ip, source, created_at::TEXT as visited_at
      FROM analytics_events
      WHERE source = ANY($1) AND event = 'link_click' AND ip IS NOT NULL ${dateFilter}
      ORDER BY ip, created_at ASC
    `, [sources, ...params]);

    // Geolocate IPs
    const ips = firstVisits.rows.map((r: any) => r.ip);
    const geoMap = await batchGeolocate(ips);
    const visitors = firstVisits.rows
      .map((r: any) => ({
        ip: r.ip,
        source: r.source,
        visited_at: r.visited_at,
        country: geoMap.get(r.ip)?.country || 'Unknown',
        countryCode: geoMap.get(r.ip)?.countryCode || 'XX',
      }))
      .sort((a: any, b: any) => b.visited_at.localeCompare(a.visited_at));

    // Merge daily data
    const dayMap: Record<string, { day: string; visitors: number; gpt: number }> = {};
    for (const row of dailyVisitors.rows) {
      dayMap[row.day] = { day: row.day, visitors: row.visitors, gpt: 0 };
    }
    for (const row of dailyGpt.rows) {
      if (!dayMap[row.day]) dayMap[row.day] = { day: row.day, visitors: 0, gpt: 0 };
      dayMap[row.day].gpt = row.gpt;
    }
    const byDay = Object.values(dayMap).sort((a, b) => a.day.localeCompare(b.day));

    return NextResponse.json({
      uniqueVisitors: uniqueVisitors.rows[0]?.count || 0,
      gptPrefills: gptPrefills.rows[0]?.count || 0,
      byDay,
      bySource: bySource.rows,
      visitors,
    });
  } catch (err: any) {
    console.error('[partner/analytics]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

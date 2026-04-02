import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { timingSafeEqual } from 'crypto';

function safeCompare(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  const token = auth?.replace('Bearer ', '');
  const password = process.env.GILAM_PASSWORD;

  if (!token || !password || !safeCompare(token, password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const range = url.searchParams.get('range') || '30d';
  const partner = url.searchParams.get('partner') || 'gilam';

  // Determine date filter
  let dateFilter = '';
  if (range === '7d') dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
  else if (range === '30d') dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
  // 'all' = no date filter

  // Determine sources for this partner
  const sources = partner === 'gilam' ? ['gilam', 'AIResearchPlus'] : [partner];
  const events = ['link_click', 'gpt_prefill', 'gpt_seedance_prefill'];

  try {
    const [
      totalClicks,
      uniqueVisitors,
      gptPrefills,
      byDay,
      bySource,
      recentEvents,
      // Conversion tracking: how many users who came from partner actually registered
      registrations,
      // How many of those converted to paid
      paidConversions,
    ] = await Promise.all([
      // Total link clicks
      query(`
        SELECT COUNT(*)::INTEGER as count FROM analytics_events
        WHERE source = ANY($1) AND event = 'link_click' ${dateFilter}
      `, [sources]),

      // Unique visitors (distinct IPs)
      query(`
        SELECT COUNT(DISTINCT ip)::INTEGER as count FROM analytics_events
        WHERE source = ANY($1) AND event = 'link_click' AND ip IS NOT NULL ${dateFilter}
      `, [sources]),

      // GPT prefill events
      query(`
        SELECT COUNT(*)::INTEGER as count FROM analytics_events
        WHERE source = ANY($1) AND event IN ('gpt_prefill', 'gpt_seedance_prefill') ${dateFilter}
      `, [sources]),

      // Events by day
      query(`
        SELECT DATE(created_at)::TEXT as day,
          COUNT(*) FILTER (WHERE event = 'link_click')::INTEGER as clicks,
          COUNT(*) FILTER (WHERE event IN ('gpt_prefill', 'gpt_seedance_prefill'))::INTEGER as gpt,
          COUNT(*)::INTEGER as total
        FROM analytics_events
        WHERE source = ANY($1) AND event = ANY($2) ${dateFilter}
        GROUP BY day ORDER BY day
      `, [sources, events]),

      // Events by source
      query(`
        SELECT source, COUNT(*)::INTEGER as count FROM analytics_events
        WHERE source = ANY($1) AND event = ANY($2) ${dateFilter}
        GROUP BY source ORDER BY count DESC
      `, [sources, events]),

      // Recent events (last 100)
      query(`
        SELECT event, source, ip, created_at, metadata FROM analytics_events
        WHERE source = ANY($1) AND event = ANY($2) ${dateFilter}
        ORDER BY created_at DESC LIMIT 100
      `, [sources, events]),

      // Users who registered after clicking partner link (same IP)
      query(`
        SELECT COUNT(DISTINCT u.id)::INTEGER as count FROM users u
        WHERE u.id::TEXT IN (
          SELECT DISTINCT ae2.user_id FROM analytics_events ae2
          WHERE ae2.user_id IS NOT NULL AND ae2.ip IN (
            SELECT DISTINCT ip FROM analytics_events
            WHERE source = ANY($1) AND event = 'link_click' AND ip IS NOT NULL ${dateFilter}
          )
        )
      `, [sources]),

      // Users from partner IPs who became paid subscribers
      query(`
        SELECT COUNT(DISTINCT s.user_id)::INTEGER as count FROM subscriptions s
        WHERE s.status = 'active' AND s.plan != 'free'
        AND s.user_id IN (
          SELECT DISTINCT ae2.user_id::INTEGER FROM analytics_events ae2
          WHERE ae2.user_id IS NOT NULL AND ae2.ip IN (
            SELECT DISTINCT ip FROM analytics_events
            WHERE source = ANY($1) AND event = 'link_click' AND ip IS NOT NULL ${dateFilter}
          )
        )
      `, [sources]),
    ]);

    return NextResponse.json({
      clicks: totalClicks.rows[0]?.count || 0,
      uniqueVisitors: uniqueVisitors.rows[0]?.count || 0,
      gptPrefills: gptPrefills.rows[0]?.count || 0,
      registrations: registrations.rows[0]?.count || 0,
      paidConversions: paidConversions.rows[0]?.count || 0,
      byDay: byDay.rows,
      bySource: bySource.rows,
      recentEvents: recentEvents.rows.map((e: any) => ({
        event: e.event,
        source: e.source,
        ip: e.ip,
        created_at: e.created_at,
        metadata: e.metadata,
      })),
    });
  } catch (err: any) {
    console.error('[partner/analytics]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

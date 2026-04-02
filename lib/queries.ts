import { query } from './db';

// ═══════════════════════════════════
// OVERVIEW / KPIs
// ═══════════════════════════════════

export async function getOverviewKPIs(from: string, to: string) {
  const prevDays = Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000);
  const prevFrom = new Date(new Date(from).getTime() - prevDays * 86400000).toISOString().slice(0, 10);
  const prevTo = new Date(new Date(from).getTime() - 86400000).toISOString().slice(0, 10);

  const [
    totalUsers,
    newUsers,
    prevNewUsers,
    activeUsers7d,
    activeSubs,
    prevActiveSubs,
    totalRuns,
    prevTotalRuns,
    completedRuns,
    totalEvents,
  ] = await Promise.all([
    query('SELECT COUNT(*)::INTEGER as count FROM users'),
    query('SELECT COUNT(*)::INTEGER as count FROM users WHERE created_at >= $1 AND created_at <= $2::date + 1', [from, to]),
    query('SELECT COUNT(*)::INTEGER as count FROM users WHERE created_at >= $1 AND created_at <= $2::date + 1', [prevFrom, prevTo]),
    query(`SELECT COUNT(DISTINCT user_id)::INTEGER as count FROM pipeline_runs WHERE updated_at >= NOW() - INTERVAL '7 days'`),
    query(`SELECT COUNT(*)::INTEGER as count, COALESCE(SUM(CASE WHEN plan='starter' THEN 16 WHEN plan='pro' THEN 42 WHEN plan='agency' THEN 109 ELSE 0 END), 0)::INTEGER as mrr FROM subscriptions WHERE status = 'active' AND plan != 'free'`),
    // Approximate previous MRR using subscription created_at — not perfect but useful
    query(`SELECT COUNT(*)::INTEGER as count FROM subscriptions WHERE status = 'active' AND plan != 'free'`),
    query('SELECT COUNT(*)::INTEGER as count FROM pipeline_runs WHERE created_at >= $1 AND created_at <= $2::date + 1', [from, to]),
    query('SELECT COUNT(*)::INTEGER as count FROM pipeline_runs WHERE created_at >= $1 AND created_at <= $2::date + 1', [prevFrom, prevTo]),
    query(`SELECT COUNT(*)::INTEGER as count FROM pipeline_runs WHERE created_at >= $1 AND created_at <= $2::date + 1 AND status IN ('completed', 'done', 'finished')`, [from, to]),
    query('SELECT COUNT(*)::INTEGER as count FROM analytics_events WHERE created_at >= $1 AND created_at <= $2::date + 1', [from, to]),
  ]);

  const mrr = activeSubs.rows[0]?.mrr || 0;
  const runsNow = totalRuns.rows[0]?.count || 0;
  const runsPrev = prevTotalRuns.rows[0]?.count || 0;
  const usersNow = newUsers.rows[0]?.count || 0;
  const usersPrev = prevNewUsers.rows[0]?.count || 0;

  return {
    totalUsers: totalUsers.rows[0]?.count || 0,
    newUsers: usersNow,
    newUsersChange: usersPrev > 0 ? ((usersNow - usersPrev) / usersPrev) * 100 : 0,
    activeUsers7d: activeUsers7d.rows[0]?.count || 0,
    mrr,
    activeSubscribers: activeSubs.rows[0]?.count || 0,
    totalRuns: runsNow,
    totalRunsChange: runsPrev > 0 ? ((runsNow - runsPrev) / runsPrev) * 100 : 0,
    completedRuns: completedRuns.rows[0]?.count || 0,
    totalEvents: totalEvents.rows[0]?.count || 0,
  };
}

// ═══════════════════════════════════
// REVENUE
// ═══════════════════════════════════

export async function getRevenueData(from: string, to: string) {
  const [planDist, topups, mrrHistory] = await Promise.all([
    query(`SELECT plan, COUNT(*)::INTEGER as count FROM subscriptions WHERE status = 'active' AND plan != 'free' GROUP BY plan ORDER BY count DESC`),
    query(`SELECT DATE(created_at)::TEXT as day, SUM(amount)::INTEGER as total FROM credit_transactions WHERE type = 'topup' AND created_at >= $1 AND created_at <= $2::date + 1 GROUP BY day ORDER BY day`, [from, to]),
    // Monthly subscriber counts for MRR trend
    query(`SELECT DATE_TRUNC('month', created_at)::DATE::TEXT as month, plan, COUNT(*)::INTEGER as count FROM subscriptions WHERE status = 'active' AND plan != 'free' GROUP BY month, plan ORDER BY month`),
  ]);

  const subscribers = await query(`
    SELECT s.plan, s.status, s.created_at, s.current_period_end, u.email, u.name,
           cb.credits_remaining, cb.credits_used_this_period, cb.period_credits_total
    FROM subscriptions s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN credit_balances cb ON cb.user_id = s.user_id
    WHERE s.status = 'active' AND s.plan != 'free'
    ORDER BY s.created_at DESC
  `);

  return {
    planDistribution: planDist.rows,
    topupsByDay: topups.rows,
    mrrHistory: mrrHistory.rows,
    subscribers: subscribers.rows,
  };
}

// ═══════════════════════════════════
// USERS
// ═══════════════════════════════════

export async function getUsersData(from: string, to: string) {
  const [daily, authSplit, sources, recentUsers] = await Promise.all([
    query('SELECT DATE(created_at)::TEXT as day, COUNT(*)::INTEGER as count FROM users WHERE created_at >= $1 AND created_at <= $2::date + 1 GROUP BY day ORDER BY day', [from, to]),
    query(`SELECT auth_provider, COUNT(*)::INTEGER as count FROM users GROUP BY auth_provider ORDER BY count DESC`),
    query(`SELECT source, COUNT(*)::INTEGER as count FROM users WHERE source IS NOT NULL AND source != '' GROUP BY source ORDER BY count DESC`),
    query(`
      SELECT u.id, u.email, u.name, u.source, u.ref_code, u.auth_provider, u.created_at,
             s.plan, s.status as sub_status, cb.credits_remaining
      FROM users u
      LEFT JOIN subscriptions s ON s.user_id = u.id
      LEFT JOIN credit_balances cb ON cb.user_id = u.id
      WHERE u.created_at >= $1 AND u.created_at <= $2::date + 1
      ORDER BY u.created_at DESC LIMIT 200
    `, [from, to]),
  ]);

  return {
    dailyRegistrations: daily.rows,
    authProviderSplit: authSplit.rows,
    sources: sources.rows,
    recentUsers: recentUsers.rows,
  };
}

// ═══════════════════════════════════
// FUNNEL
// ═══════════════════════════════════

export async function getFunnelData(from: string, to: string) {
  const [events, onboardingFunnel] = await Promise.all([
    query(`
      SELECT event, COUNT(*)::INTEGER as count
      FROM analytics_events
      WHERE created_at >= $1 AND created_at <= $2::date + 1
      GROUP BY event ORDER BY count DESC
    `, [from, to]),
    query(`
      SELECT event, COUNT(*)::INTEGER as count
      FROM analytics_events
      WHERE event LIKE 'onboarding_%' AND created_at >= $1 AND created_at <= $2::date + 1
      GROUP BY event ORDER BY count DESC
    `, [from, to]),
  ]);

  const totalVisits = events.rows.find((r: any) => r.event === 'page_visit')?.count || 0;
  const totalRegistrations = await query('SELECT COUNT(*)::INTEGER as count FROM users WHERE created_at >= $1 AND created_at <= $2::date + 1', [from, to]);
  const totalSubscriptions = await query(`SELECT COUNT(*)::INTEGER as count FROM subscriptions WHERE created_at >= $1 AND created_at <= $2::date + 1 AND plan != 'free'`, [from, to]);
  const firstVideos = await query(`
    SELECT COUNT(DISTINCT user_id)::INTEGER as count FROM pipeline_runs
    WHERE created_at >= $1 AND created_at <= $2::date + 1
  `, [from, to]);

  return {
    eventCounts: events.rows,
    onboardingFunnel: onboardingFunnel.rows,
    mainFunnel: {
      visits: totalVisits,
      registrations: totalRegistrations.rows[0]?.count || 0,
      firstVideo: firstVideos.rows[0]?.count || 0,
      subscriptions: totalSubscriptions.rows[0]?.count || 0,
    },
  };
}

// ═══════════════════════════════════
// PRODUCT USAGE
// ═══════════════════════════════════

export async function getUsageData(from: string, to: string) {
  const [daily, byStatus, topUsers, recentRuns] = await Promise.all([
    query('SELECT DATE(created_at)::TEXT as day, COUNT(*)::INTEGER as count FROM pipeline_runs WHERE created_at >= $1 AND created_at <= $2::date + 1 GROUP BY day ORDER BY day', [from, to]),
    query('SELECT status, COUNT(*)::INTEGER as count FROM pipeline_runs WHERE created_at >= $1 AND created_at <= $2::date + 1 GROUP BY status ORDER BY count DESC', [from, to]),
    query(`
      SELECT u.email, u.name, COUNT(pr.run_id)::INTEGER as runs
      FROM pipeline_runs pr JOIN users u ON u.id = pr.user_id
      WHERE pr.created_at >= $1 AND pr.created_at <= $2::date + 1
      GROUP BY u.email, u.name ORDER BY runs DESC LIMIT 15
    `, [from, to]),
    query(`
      SELECT pr.run_id, pr.status, pr.product_name, pr.created_at, u.email
      FROM pipeline_runs pr LEFT JOIN users u ON u.id = pr.user_id
      WHERE pr.created_at >= $1 AND pr.created_at <= $2::date + 1
      ORDER BY pr.created_at DESC LIMIT 50
    `, [from, to]),
  ]);

  return {
    dailyRuns: daily.rows,
    statusDistribution: byStatus.rows,
    topUsers: topUsers.rows,
    recentRuns: recentRuns.rows,
  };
}

// ═══════════════════════════════════
// CREDITS
// ═══════════════════════════════════

export async function getCreditsData(from: string, to: string) {
  const [dailyUsage, byType, utilization, exhausted] = await Promise.all([
    query(`
      SELECT DATE(created_at)::TEXT as day, SUM(ABS(amount))::INTEGER as consumed
      FROM credit_transactions WHERE amount < 0 AND created_at >= $1 AND created_at <= $2::date + 1
      GROUP BY day ORDER BY day
    `, [from, to]),
    query(`
      SELECT type, SUM(ABS(amount))::INTEGER as total
      FROM credit_transactions WHERE amount < 0 AND created_at >= $1 AND created_at <= $2::date + 1
      GROUP BY type ORDER BY total DESC
    `, [from, to]),
    query(`
      SELECT u.email, u.name, s.plan, cb.credits_remaining, cb.credits_used_this_period, cb.period_credits_total,
        CASE WHEN cb.period_credits_total > 0
          THEN ROUND((cb.credits_used_this_period::NUMERIC / cb.period_credits_total) * 100, 1)
          ELSE 0 END as utilization_pct
      FROM credit_balances cb
      JOIN users u ON u.id = cb.user_id
      LEFT JOIN subscriptions s ON s.user_id = cb.user_id
      ORDER BY utilization_pct DESC
    `),
    query(`
      SELECT COUNT(*)::INTEGER as count FROM credit_balances cb
      JOIN subscriptions s ON s.user_id = cb.user_id
      WHERE s.status = 'active' AND s.plan != 'free' AND cb.credits_remaining <= 0
    `),
  ]);

  return {
    dailyUsage: dailyUsage.rows,
    usageByType: byType.rows,
    userUtilization: utilization.rows,
    usersExhausted: exhausted.rows[0]?.count || 0,
  };
}

// ═══════════════════════════════════
// API COSTS
// ═══════════════════════════════════

export async function getCostsData(from: string, to: string) {
  const falKey = process.env.FAL_KEY;
  if (!falKey) return null;

  const headers = { 'Authorization': `Key ${falKey}` };
  const startDate = new Date(from).toISOString();
  const endDate = new Date(to + 'T23:59:59Z').toISOString();

  // Fetch all pages of usage data (GET with query params, timeframe=day)
  let allBuckets: any[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 10; page++) {
    const params = new URLSearchParams({
      start: startDate,
      end: endDate,
      timeframe: 'day',
      limit: '100',
    });
    if (cursor) params.set('cursor', cursor);

    const res = await fetch(`https://api.fal.ai/v1/models/usage?${params}`, { headers });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`fal.ai API error: ${res.status} ${err}`);
    }
    const json = await res.json();
    const buckets = json.time_series || [];
    allBuckets = allBuckets.concat(buckets);
    if (!json.has_more) break;
    cursor = json.next_cursor;
  }

  // Fetch credit balance
  const balanceRes = await fetch('https://api.fal.ai/v1/account/billing?expand=credits', { headers });
  const balance = balanceRes.ok ? await balanceRes.json() : null;

  // Process time_series buckets into daily and per-endpoint aggregations
  const dailyMap: Record<string, { day: string; cost: number; requests: number }> = {};
  const endpointMap: Record<string, { endpoint: string; requests: number; cost: number; unit_price: number }> = {};

  for (const bucket of allBuckets) {
    const day = (bucket.bucket || '').slice(0, 10);
    if (!day) continue;

    for (const result of (bucket.results || [])) {
      const cost = result.cost || 0;
      const qty = result.quantity || 0;
      const endpoint = result.endpoint_id || 'unknown';

      // Daily aggregation
      if (!dailyMap[day]) dailyMap[day] = { day, cost: 0, requests: 0 };
      dailyMap[day].cost += cost;
      dailyMap[day].requests += qty;

      // Endpoint aggregation
      if (!endpointMap[endpoint]) endpointMap[endpoint] = { endpoint, requests: 0, cost: 0, unit_price: result.unit_price || 0 };
      endpointMap[endpoint].requests += qty;
      endpointMap[endpoint].cost += cost;
    }
  }

  const dailyCosts = Object.values(dailyMap).sort((a, b) => a.day.localeCompare(b.day));
  const costsByEndpoint = Object.values(endpointMap).sort((a, b) => b.cost - a.cost);
  const totalCost = dailyCosts.reduce((sum, d) => sum + d.cost, 0);
  const totalRequests = dailyCosts.reduce((sum, d) => sum + d.requests, 0);

  return {
    dailyCosts,
    costsByEndpoint,
    totalCost,
    totalRequests,
    creditBalance: balance?.credits?.current_balance ?? null,
    currency: balance?.credits?.currency || 'USD',
  };
}

// ═══════════════════════════════════
// ACQUISITION
// ═══════════════════════════════════

export async function getAcquisitionData(from: string, to: string) {
  const [dailyVisits, bySource, byDay, topReferrers] = await Promise.all([
    query(`
      SELECT DATE(created_at)::TEXT as day, COUNT(*)::INTEGER as count
      FROM analytics_events WHERE event IN ('page_visit','link_click','dashboard_visit')
        AND created_at >= $1 AND created_at <= $2::date + 1
      GROUP BY day ORDER BY day
    `, [from, to]),
    query(`
      SELECT source, COUNT(*)::INTEGER as count
      FROM analytics_events WHERE created_at >= $1 AND created_at <= $2::date + 1
      GROUP BY source ORDER BY count DESC
    `, [from, to]),
    query(`
      SELECT DATE(created_at)::TEXT as day, source, COUNT(*)::INTEGER as count
      FROM analytics_events WHERE created_at >= $1 AND created_at <= $2::date + 1
      GROUP BY day, source ORDER BY day
    `, [from, to]),
    query(`
      SELECT metadata->>'referrer' as referrer, COUNT(*)::INTEGER as count
      FROM analytics_events
      WHERE metadata->>'referrer' IS NOT NULL AND metadata->>'referrer' != ''
        AND created_at >= $1 AND created_at <= $2::date + 1
      GROUP BY referrer ORDER BY count DESC LIMIT 20
    `, [from, to]),
  ]);

  return {
    dailyVisits: dailyVisits.rows,
    bySource: bySource.rows,
    dailyBySource: byDay.rows,
    topReferrers: topReferrers.rows,
  };
}

// ═══════════════════════════════════
// LIVE VIEW
// ═══════════════════════════════════

export async function getLiveData() {
  const [recentEvents, activeNow, activePaths] = await Promise.all([
    query(`
      SELECT id, event, source, ip, metadata, created_at
      FROM analytics_events
      ORDER BY created_at DESC LIMIT 50
    `),
    query(`
      SELECT COUNT(DISTINCT ip)::INTEGER as count
      FROM analytics_events
      WHERE created_at >= NOW() - INTERVAL '5 minutes' AND ip IS NOT NULL AND ip != ''
    `),
    query(`
      SELECT metadata->>'path' as path, COUNT(*)::INTEGER as count
      FROM analytics_events WHERE created_at >= NOW() - INTERVAL '5 minutes'
      GROUP BY path ORDER BY count DESC LIMIT 10
    `),
  ]);

  return {
    recentEvents: recentEvents.rows,
    activeUsers: activeNow.rows[0]?.count || 0,
    activePaths: activePaths.rows,
  };
}

// ═══════════════════════════════════
// GEO
// ═══════════════════════════════════

export async function getGeoData(from: string, to: string) {
  const [ips, userIps, subscriberIps] = await Promise.all([
    // Events by IP
    query(`
      SELECT ip, COUNT(*)::INTEGER as count
      FROM analytics_events
      WHERE ip IS NOT NULL AND ip != '' AND created_at >= $1 AND created_at <= $2::date + 1
      GROUP BY ip ORDER BY count DESC LIMIT 500
    `, [from, to]),
    // Registered users — get their most recent IP from analytics_events
    query(`
      SELECT u.id, u.email, u.created_at::TEXT as registered_at, ae.ip
      FROM users u
      LEFT JOIN LATERAL (
        SELECT ip FROM analytics_events WHERE user_id::TEXT = u.id::TEXT AND ip IS NOT NULL AND ip != '' ORDER BY created_at DESC LIMIT 1
      ) ae ON TRUE
      WHERE u.created_at >= $1 AND u.created_at <= $2::date + 1
    `, [from, to]),
    // Paying subscribers — get their most recent IP
    query(`
      SELECT u.id, u.email, s.plan, s.status, ae.ip
      FROM subscriptions s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN LATERAL (
        SELECT ip FROM analytics_events WHERE user_id::TEXT = u.id::TEXT AND ip IS NOT NULL AND ip != '' ORDER BY created_at DESC LIMIT 1
      ) ae ON TRUE
      WHERE s.status = 'active' AND s.plan != 'free'
    `),
  ]);

  return { ipCounts: ips.rows, userIps: userIps.rows, subscriberIps: subscriberIps.rows };
}

// ═══════════════════════════════════
// ABUSE DETECTION
// ═══════════════════════════════════

export async function getAbuseData() {
  const suspicious = await query(`
    WITH user_ips AS (
      SELECT DISTINCT ae.ip, u.id as user_id, u.email, u.created_at,
        cb.first_free_used
      FROM analytics_events ae
      JOIN users u ON ae.user_id::INTEGER = u.id
      LEFT JOIN credit_balances cb ON cb.user_id = u.id
      WHERE ae.ip IS NOT NULL AND ae.ip != ''
    ),
    ip_counts AS (
      SELECT ip, COUNT(DISTINCT user_id)::INTEGER as account_count,
        ARRAY_AGG(DISTINCT email) as emails,
        COUNT(DISTINCT CASE WHEN first_free_used THEN user_id END)::INTEGER as free_trials
      FROM user_ips
      GROUP BY ip
      HAVING COUNT(DISTINCT user_id) >= 2
    )
    SELECT * FROM ip_counts ORDER BY account_count DESC LIMIT 100
  `);

  return { suspiciousIPs: suspicious.rows };
}

// ═══════════════════════════════════
// COHORTS
// ═══════════════════════════════════

export async function getCohortData() {
  const cohorts = await query(`
    WITH user_cohorts AS (
      SELECT u.id, DATE_TRUNC('month', u.created_at)::DATE::TEXT as cohort_month
      FROM users u
    ),
    activity AS (
      SELECT pr.user_id, DATE_TRUNC('month', pr.created_at)::DATE::TEXT as active_month
      FROM pipeline_runs pr
      GROUP BY pr.user_id, active_month
    )
    SELECT uc.cohort_month, a.active_month, COUNT(DISTINCT a.user_id)::INTEGER as active_users,
      (SELECT COUNT(*) FROM user_cohorts WHERE cohort_month = uc.cohort_month)::INTEGER as cohort_size
    FROM user_cohorts uc
    LEFT JOIN activity a ON a.user_id = uc.id
    GROUP BY uc.cohort_month, a.active_month
    ORDER BY uc.cohort_month, a.active_month
  `);

  return { cohorts: cohorts.rows };
}

// ═══════════════════════════════════
// CHURN
// ═══════════════════════════════════

export async function getChurnData(from: string, to: string) {
  const [cancelled, paymentFailed, byPlan] = await Promise.all([
    query(`
      SELECT DATE(updated_at)::TEXT as day, COUNT(*)::INTEGER as count
      FROM subscriptions WHERE status = 'cancelled' AND updated_at >= $1 AND updated_at <= $2::date + 1
      GROUP BY day ORDER BY day
    `, [from, to]),
    query(`
      SELECT COUNT(*)::INTEGER as count FROM subscriptions WHERE status = 'past_due'
    `),
    query(`
      SELECT plan, COUNT(*)::INTEGER as count
      FROM subscriptions WHERE status = 'cancelled' AND updated_at >= $1 AND updated_at <= $2::date + 1
      GROUP BY plan ORDER BY count DESC
    `, [from, to]),
  ]);

  return {
    dailyCancellations: cancelled.rows,
    paymentFailures: paymentFailed.rows[0]?.count || 0,
    churnByPlan: byPlan.rows,
  };
}

// ═══════════════════════════════════
// SEGMENTS
// ═══════════════════════════════════

export async function getSegmentsData() {
  const [powerUsers, atRisk, sleepers, upgradeCandidate, newNoSub] = await Promise.all([
    // Power users: top usage
    query(`
      SELECT u.email, u.name, s.plan, cb.credits_used_this_period, cb.period_credits_total
      FROM credit_balances cb
      JOIN users u ON u.id = cb.user_id
      LEFT JOIN subscriptions s ON s.user_id = cb.user_id
      WHERE cb.credits_used_this_period > 0
      ORDER BY cb.credits_used_this_period DESC LIMIT 20
    `),
    // At risk: active sub but no runs in 14 days
    query(`
      SELECT u.email, u.name, s.plan, s.created_at as sub_date,
        (SELECT MAX(pr.created_at) FROM pipeline_runs pr WHERE pr.user_id = u.id) as last_run
      FROM subscriptions s
      JOIN users u ON u.id = s.user_id
      WHERE s.status = 'active' AND s.plan != 'free'
        AND NOT EXISTS (SELECT 1 FROM pipeline_runs pr WHERE pr.user_id = u.id AND pr.created_at >= NOW() - INTERVAL '14 days')
    `),
    // Sleepers: paying but <10% usage
    query(`
      SELECT u.email, u.name, s.plan, cb.credits_remaining, cb.credits_used_this_period, cb.period_credits_total
      FROM credit_balances cb
      JOIN users u ON u.id = cb.user_id
      JOIN subscriptions s ON s.user_id = cb.user_id
      WHERE s.status = 'active' AND s.plan != 'free' AND cb.period_credits_total > 0
        AND (cb.credits_used_this_period::NUMERIC / cb.period_credits_total) < 0.1
    `),
    // Upgrade candidates: >90% usage
    query(`
      SELECT u.email, u.name, s.plan, cb.credits_used_this_period, cb.period_credits_total
      FROM credit_balances cb
      JOIN users u ON u.id = cb.user_id
      JOIN subscriptions s ON s.user_id = cb.user_id
      WHERE s.status = 'active' AND s.plan != 'free' AND cb.period_credits_total > 0
        AND (cb.credits_used_this_period::NUMERIC / cb.period_credits_total) > 0.9
    `),
    // New signups without subscription (last 7 days)
    query(`
      SELECT u.email, u.name, u.source, u.created_at
      FROM users u
      LEFT JOIN subscriptions s ON s.user_id = u.id AND s.plan != 'free'
      WHERE u.created_at >= NOW() - INTERVAL '7 days' AND s.id IS NULL
      ORDER BY u.created_at DESC
    `),
  ]);

  return {
    powerUsers: powerUsers.rows,
    atRisk: atRisk.rows,
    sleepers: sleepers.rows,
    upgradeCandidates: upgradeCandidate.rows,
    newWithoutSub: newNoSub.rows,
  };
}

// ═══════════════════════════════════
// FEEDBACK
// ═══════════════════════════════════

export async function getFeedbackData(from: string, to: string) {
  const feedback = await query(`
    SELECT f.id, f.message, f.page_url, f.created_at, u.email, u.name
    FROM feedback f
    LEFT JOIN users u ON u.id = f.user_id
    WHERE f.created_at >= $1 AND f.created_at <= $2::date + 1
    ORDER BY f.created_at DESC LIMIT 100
  `, [from, to]);

  return { feedback: feedback.rows };
}

// ═══════════════════════════════════
// DEVICES & PAGES
// ═══════════════════════════════════

export async function getDevicesData(from: string, to: string) {
  const events = await query(`
    SELECT metadata->>'user_agent' as ua, COUNT(*)::INTEGER as count
    FROM analytics_events
    WHERE metadata->>'user_agent' IS NOT NULL AND metadata->>'user_agent' != ''
      AND created_at >= $1 AND created_at <= $2::date + 1
    GROUP BY ua
  `, [from, to]);

  // Parse user agents
  const devices: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0 };
  const browsers: Record<string, number> = {};
  const oses: Record<string, number> = {};

  for (const row of events.rows) {
    const ua = (row.ua || '').toLowerCase();
    const count = row.count;
    // Device
    if (/ipad|tablet/i.test(ua)) devices['Tablet'] += count;
    else if (/mobile|iphone|android/i.test(ua)) devices['Mobile'] += count;
    else devices['Desktop'] += count;
    // Browser
    if (/edg/i.test(ua)) browsers['Edge'] = (browsers['Edge'] || 0) + count;
    else if (/chrome/i.test(ua)) browsers['Chrome'] = (browsers['Chrome'] || 0) + count;
    else if (/safari/i.test(ua)) browsers['Safari'] = (browsers['Safari'] || 0) + count;
    else if (/firefox/i.test(ua)) browsers['Firefox'] = (browsers['Firefox'] || 0) + count;
    else browsers['Other'] = (browsers['Other'] || 0) + count;
    // OS
    if (/windows/i.test(ua)) oses['Windows'] = (oses['Windows'] || 0) + count;
    else if (/mac/i.test(ua)) oses['Mac'] = (oses['Mac'] || 0) + count;
    else if (/iphone|ipad/i.test(ua)) oses['iOS'] = (oses['iOS'] || 0) + count;
    else if (/android/i.test(ua)) oses['Android'] = (oses['Android'] || 0) + count;
    else if (/linux/i.test(ua)) oses['Linux'] = (oses['Linux'] || 0) + count;
    else oses['Other'] = (oses['Other'] || 0) + count;
  }

  return { devices, browsers, oses };
}

export async function getPagesData(from: string, to: string) {
  const pages = await query(`
    SELECT metadata->>'path' as path, COUNT(*)::INTEGER as visits,
      COUNT(DISTINCT ip)::INTEGER as unique_visitors
    FROM analytics_events
    WHERE metadata->>'path' IS NOT NULL AND created_at >= $1 AND created_at <= $2::date + 1
    GROUP BY path ORDER BY visits DESC LIMIT 30
  `, [from, to]);

  return { pages: pages.rows };
}

// ═══════════════════════════════════
// LTV
// ═══════════════════════════════════

export async function getLTVData() {
  const [byPlan, avgMonths] = await Promise.all([
    query(`
      SELECT s.plan,
        AVG(EXTRACT(EPOCH FROM (COALESCE(
          CASE WHEN s.status = 'cancelled' THEN s.updated_at END, NOW()
        ) - s.created_at)) / 86400 / 30)::NUMERIC(10,1) as avg_months,
        COUNT(*)::INTEGER as users
      FROM subscriptions s
      WHERE s.plan != 'free'
      GROUP BY s.plan
    `),
    query(`
      SELECT AVG(EXTRACT(EPOCH FROM (COALESCE(
        CASE WHEN s.status = 'cancelled' THEN s.updated_at END, NOW()
      ) - s.created_at)) / 86400 / 30)::NUMERIC(10,1) as avg_months
      FROM subscriptions s WHERE s.plan != 'free'
    `),
  ]);

  const PLAN_PRICES: Record<string, number> = { starter: 16, pro: 42, agency: 109 };
  const ltvByPlan = byPlan.rows.map((r: any) => ({
    plan: r.plan,
    avgMonths: parseFloat(r.avg_months) || 0,
    ltv: Math.round((parseFloat(r.avg_months) || 0) * (PLAN_PRICES[r.plan] || 0)),
    users: r.users,
  }));

  return {
    ltvByPlan,
    avgMonths: parseFloat(avgMonths.rows[0]?.avg_months) || 0,
  };
}

// ═══════════════════════════════════
// EXPANSION
// ═══════════════════════════════════

export async function getExpansionData(from: string, to: string) {
  const topupRevenue = await query(`
    SELECT DATE(created_at)::TEXT as day, SUM(amount)::INTEGER as credits, COUNT(*)::INTEGER as count
    FROM credit_transactions WHERE type = 'topup' AND created_at >= $1 AND created_at <= $2::date + 1
    GROUP BY day ORDER BY day
  `, [from, to]);

  return { topupsByDay: topupRevenue.rows };
}

// ═══════════════════════════════════
// VELOCITY
// ═══════════════════════════════════

export async function getVelocityData() {
  const [timeToFirstVideo, timeToSub] = await Promise.all([
    query(`
      SELECT AVG(EXTRACT(EPOCH FROM (first_run - u.created_at)) / 3600)::NUMERIC(10,1) as avg_hours
      FROM users u
      JOIN (SELECT user_id, MIN(created_at) as first_run FROM pipeline_runs GROUP BY user_id) fr ON fr.user_id = u.id
    `),
    query(`
      SELECT AVG(EXTRACT(EPOCH FROM (s.created_at - u.created_at)) / 3600)::NUMERIC(10,1) as avg_hours
      FROM users u
      JOIN subscriptions s ON s.user_id = u.id
      WHERE s.plan != 'free'
    `),
  ]);

  return {
    avgHoursToFirstVideo: parseFloat(timeToFirstVideo.rows[0]?.avg_hours) || 0,
    avgHoursToSubscription: parseFloat(timeToSub.rows[0]?.avg_hours) || 0,
  };
}

// ═══════════════════════════════════
// FEATURES
// ═══════════════════════════════════

export async function getFeaturesData(from: string, to: string) {
  const [pipelineUsers, breakdownUsers, editorUsers, avatarUsers] = await Promise.all([
    query(`SELECT COUNT(DISTINCT user_id)::INTEGER as count FROM pipeline_runs WHERE created_at >= $1 AND created_at <= $2::date + 1`, [from, to]),
    query(`SELECT COUNT(DISTINCT user_id)::INTEGER as count FROM credit_transactions WHERE type = 'video_breakdown' AND created_at >= $1 AND created_at <= $2::date + 1`, [from, to]),
    query(`SELECT COUNT(DISTINCT user_id)::INTEGER as count FROM credit_transactions WHERE type = 'editor_transcribe' AND created_at >= $1 AND created_at <= $2::date + 1`, [from, to]),
    query(`SELECT COUNT(DISTINCT user_id)::INTEGER as count FROM credit_transactions WHERE type IN ('avatar_gen','avatar_gen_pro') AND created_at >= $1 AND created_at <= $2::date + 1`, [from, to]),
  ]);

  const totalActive = await query(`SELECT COUNT(DISTINCT user_id)::INTEGER as count FROM pipeline_runs WHERE created_at >= $1 AND created_at <= $2::date + 1`, [from, to]);
  const total = totalActive.rows[0]?.count || 1;

  return {
    features: [
      { name: 'Video Pipeline', users: pipelineUsers.rows[0]?.count || 0, pct: Math.round(((pipelineUsers.rows[0]?.count || 0) / total) * 100) },
      { name: 'Video Breakdown', users: breakdownUsers.rows[0]?.count || 0, pct: Math.round(((breakdownUsers.rows[0]?.count || 0) / total) * 100) },
      { name: 'Video Editor', users: editorUsers.rows[0]?.count || 0, pct: Math.round(((editorUsers.rows[0]?.count || 0) / total) * 100) },
      { name: 'Avatar Creator', users: avatarUsers.rows[0]?.count || 0, pct: Math.round(((avatarUsers.rows[0]?.count || 0) / total) * 100) },
    ],
  };
}

// ═══════════════════════════════════
// ERRORS
// ═══════════════════════════════════

export async function getErrorsData(from: string, to: string) {
  const [dailyFailures, failedRuns] = await Promise.all([
    query(`
      SELECT DATE(created_at)::TEXT as day, COUNT(*)::INTEGER as count
      FROM pipeline_runs WHERE status IN ('error','failed') AND created_at >= $1 AND created_at <= $2::date + 1
      GROUP BY day ORDER BY day
    `, [from, to]),
    query(`
      SELECT pr.run_id, pr.status, pr.product_name, pr.created_at, u.email
      FROM pipeline_runs pr LEFT JOIN users u ON u.id = pr.user_id
      WHERE pr.status IN ('error','failed') AND pr.created_at >= $1 AND pr.created_at <= $2::date + 1
      ORDER BY pr.created_at DESC LIMIT 30
    `, [from, to]),
  ]);

  return {
    dailyFailures: dailyFailures.rows,
    failedRuns: failedRuns.rows,
  };
}

// ═══════════════════════════════════
// USER JOURNEY
// ═══════════════════════════════════

export async function getUserJourney(email: string) {
  const user = await query(`
    SELECT u.*, s.plan, s.status as sub_status, s.created_at as sub_date,
      cb.credits_remaining, cb.credits_used_this_period, cb.period_credits_total
    FROM users u
    LEFT JOIN subscriptions s ON s.user_id = u.id
    LEFT JOIN credit_balances cb ON cb.user_id = u.id
    WHERE u.email = $1
  `, [email]);

  if (user.rows.length === 0) return null;

  const userId = user.rows[0].id;
  const [runs, transactions, feedbacks, events] = await Promise.all([
    query('SELECT run_id, status, product_name, created_at FROM pipeline_runs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]),
    query('SELECT amount, type, description, balance_after, created_at FROM credit_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]),
    query('SELECT message, page_url, created_at FROM feedback WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20', [userId]),
    query(`SELECT event, source, metadata, created_at FROM analytics_events WHERE user_id = $1::TEXT ORDER BY created_at DESC LIMIT 50`, [userId]),
  ]);

  return {
    user: user.rows[0],
    runs: runs.rows,
    transactions: transactions.rows,
    feedback: feedbacks.rows,
    events: events.rows,
  };
}

// ═══════════════════════════════════
// RETURNING USERS
// ═══════════════════════════════════

export async function getReturningData(from: string, to: string) {
  const daily = await query(`
    SELECT DATE(ae.created_at)::TEXT as day,
      COUNT(DISTINCT CASE WHEN u.created_at::DATE = ae.created_at::DATE THEN ae.ip END)::INTEGER as new_users,
      COUNT(DISTINCT CASE WHEN u.created_at::DATE < ae.created_at::DATE THEN ae.ip END)::INTEGER as returning_users
    FROM analytics_events ae
    LEFT JOIN users u ON ae.user_id::TEXT = u.id::TEXT
    WHERE ae.created_at >= $1 AND ae.created_at <= $2::date + 1
      AND ae.event IN ('page_visit','dashboard_visit')
    GROUP BY day ORDER BY day
  `, [from, to]);

  return { daily: daily.rows };
}

// ═══════════════════════════════════
// CHECKOUT (Stripe)
// ═══════════════════════════════════

export async function getCheckoutData(from: string, to: string) {
  const sk = process.env.STRIPE_SECRET_KEY;
  if (!sk) return null;

  const headers = {
    'Authorization': `Bearer ${sk}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const fromTs = Math.floor(new Date(from).getTime() / 1000);
  const toTs = Math.floor(new Date(to + 'T23:59:59Z').getTime() / 1000);

  const [sessionsRes, chargesRes, refundsRes] = await Promise.all([
    fetch(`https://api.stripe.com/v1/checkout/sessions?created[gte]=${fromTs}&created[lte]=${toTs}&limit=100&expand[]=data.payment_intent`, { headers }),
    fetch(`https://api.stripe.com/v1/charges?created[gte]=${fromTs}&created[lte]=${toTs}&limit=100`, { headers }),
    fetch(`https://api.stripe.com/v1/refunds?created[gte]=${fromTs}&created[lte]=${toTs}&limit=100`, { headers }),
  ]);

  const sessions = await sessionsRes.json();
  const charges = await chargesRes.json();
  const refunds = await refundsRes.json();

  const sessionList = sessions.data || [];
  const chargeList = charges.data || [];
  const refundList = refunds.data || [];

  const totalSessions = sessionList.length;
  const completedSessions = sessionList.filter((s: any) => s.payment_status === 'paid').length;
  const expiredSessions = sessionList.filter((s: any) => s.status === 'expired').length;
  const openSessions = sessionList.filter((s: any) => s.status === 'open').length;

  const totalRevenue = chargeList.filter((c: any) => c.paid && !c.refunded).reduce((sum: number, c: any) => sum + c.amount, 0) / 100;
  const totalRefunded = refundList.reduce((sum: number, r: any) => sum + r.amount, 0) / 100;
  const avgOrderValue = completedSessions > 0 ? totalRevenue / completedSessions : 0;
  const conversionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  // Daily breakdown
  const dailyMap: Record<string, { date: string; completed: number; expired: number; revenue: number }> = {};
  for (const s of sessionList) {
    const day = new Date(s.created * 1000).toISOString().slice(0, 10);
    if (!dailyMap[day]) dailyMap[day] = { date: day, completed: 0, expired: 0, revenue: 0 };
    if (s.payment_status === 'paid') {
      dailyMap[day].completed++;
      dailyMap[day].revenue += (s.amount_total || 0) / 100;
    }
    if (s.status === 'expired') dailyMap[day].expired++;
  }
  const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  // Recent sessions
  const recentSessions = sessionList.slice(0, 20).map((s: any) => ({
    id: s.id,
    email: s.customer_details?.email || s.customer_email || '—',
    amount: (s.amount_total || 0) / 100,
    currency: s.currency?.toUpperCase() || 'USD',
    status: s.payment_status === 'paid' ? 'Paid' : s.status === 'expired' ? 'Expired' : 'Open',
    created: new Date(s.created * 1000).toISOString().slice(0, 16).replace('T', ' '),
  }));

  return {
    kpis: { totalSessions, completedSessions, expiredSessions, openSessions, totalRevenue, totalRefunded, avgOrderValue, conversionRate },
    daily,
    recentSessions,
  };
}

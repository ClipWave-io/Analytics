import { NextResponse } from 'next/server';
import {
  getOverviewKPIs, getRevenueData, getUsersData, getFunnelData,
  getUsageData, getCreditsData, getCostsData, getAcquisitionData,
  getLiveData, getGeoData, getAbuseData, getCohortData, getChurnData,
  getSegmentsData, getFeedbackData, getDevicesData, getPagesData,
  getLTVData, getExpansionData, getVelocityData, getFeaturesData,
  getErrorsData, getUserJourney, getReturningData, getCheckoutData,
} from '@/lib/queries';
import { batchGeolocate } from '@/lib/geo';

type Params = Promise<{ section: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  const { section } = await params;
  const url = new URL(request.url);
  const from = url.searchParams.get('from') || '2024-01-01';
  const to = url.searchParams.get('to') || new Date().toISOString().slice(0, 10);

  try {
    switch (section) {
      case 'overview':
        return NextResponse.json(await getOverviewKPIs(from, to));
      case 'revenue':
        return NextResponse.json(await getRevenueData(from, to));
      case 'users':
        return NextResponse.json(await getUsersData(from, to));
      case 'funnel':
        return NextResponse.json(await getFunnelData(from, to));
      case 'usage':
        return NextResponse.json(await getUsageData(from, to));
      case 'credits':
        return NextResponse.json(await getCreditsData(from, to));
      case 'costs': {
        const costsData = await getCostsData(from, to);
        if (!costsData) return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 400 });
        return NextResponse.json(costsData);
      }
      case 'acquisition':
        return NextResponse.json(await getAcquisitionData(from, to));
      case 'live':
        return NextResponse.json(await getLiveData());
      case 'geo': {
        const geoRaw = await getGeoData(from, to);
        // Collect all unique IPs for geolocation
        const allIps = new Set<string>();
        for (const r of geoRaw.ipCounts) if (r.ip) allIps.add(r.ip);
        for (const r of geoRaw.userIps) if (r.ip) allIps.add(r.ip);
        for (const r of geoRaw.subscriberIps) if (r.ip) allIps.add(r.ip);
        const geoMap = await batchGeolocate(Array.from(allIps));

        // Events by country
        const countryCounts: Record<string, { country: string; code: string; count: number }> = {};
        for (const row of geoRaw.ipCounts) {
          const geo = geoMap.get(row.ip) || { country: 'Unknown', countryCode: 'XX' };
          if (!countryCounts[geo.country]) countryCounts[geo.country] = { country: geo.country, code: geo.countryCode, count: 0 };
          countryCounts[geo.country].count += row.count;
        }

        // Individual IPs with geo and associated accounts
        const ipSessions = geoRaw.ipCounts.map((row: any) => {
          const geo = geoMap.get(row.ip) || { country: 'Unknown', countryCode: 'XX', city: '' };
          const accts = geoRaw.ipAccountMap[row.ip] || { emails: [], account_count: 0 };
          return { ip: row.ip, events: row.count, country: geo.country, code: geo.countryCode, city: geo.city || '', accounts: accts.account_count, emails: accts.emails };
        });

        // Registered users by country
        const userCountryCounts: Record<string, { country: string; code: string; count: number }> = {};
        const usersWithGeo = geoRaw.userIps.map((row: any) => {
          const geo = row.ip ? (geoMap.get(row.ip) || { country: 'Unknown', countryCode: 'XX', city: '' }) : { country: 'Unknown', countryCode: 'XX', city: '' };
          const c = geo.country;
          if (!userCountryCounts[c]) userCountryCounts[c] = { country: c, code: geo.countryCode, count: 0 };
          userCountryCounts[c].count++;
          return { email: row.email, registered_at: row.registered_at, country: c, city: geo.city || '' };
        });

        // Subscribers by country
        const subCountryCounts: Record<string, { country: string; code: string; count: number }> = {};
        const subsWithGeo = geoRaw.subscriberIps.map((row: any) => {
          const geo = row.ip ? (geoMap.get(row.ip) || { country: 'Unknown', countryCode: 'XX', city: '' }) : { country: 'Unknown', countryCode: 'XX', city: '' };
          const c = geo.country;
          if (!subCountryCounts[c]) subCountryCounts[c] = { country: c, code: geo.countryCode, count: 0 };
          subCountryCounts[c].count++;
          return { email: row.email, plan: row.plan, country: c, city: geo.city || '' };
        });

        return NextResponse.json({
          countries: Object.values(countryCounts).sort((a, b) => b.count - a.count),
          totalCountries: Object.keys(countryCounts).length,
          ipSessions,
          usersWithGeo,
          usersByCountry: Object.values(userCountryCounts).sort((a, b) => b.count - a.count),
          subsWithGeo,
          subsByCountry: Object.values(subCountryCounts).sort((a, b) => b.count - a.count),
        });
      }
      case 'abuse':
        return NextResponse.json(await getAbuseData());
      case 'cohorts':
        return NextResponse.json(await getCohortData());
      case 'churn':
        return NextResponse.json(await getChurnData(from, to));
      case 'segments':
        return NextResponse.json(await getSegmentsData());
      case 'feedback':
        return NextResponse.json(await getFeedbackData(from, to));
      case 'devices':
        return NextResponse.json(await getDevicesData(from, to));
      case 'pages':
        return NextResponse.json(await getPagesData(from, to));
      case 'ltv':
        return NextResponse.json(await getLTVData());
      case 'expansion':
        return NextResponse.json(await getExpansionData(from, to));
      case 'velocity':
        return NextResponse.json(await getVelocityData());
      case 'features':
        return NextResponse.json(await getFeaturesData(from, to));
      case 'errors':
        return NextResponse.json(await getErrorsData(from, to));
      case 'journey': {
        const email = url.searchParams.get('email');
        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
        const data = await getUserJourney(email);
        if (!data) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        return NextResponse.json(data);
      }
      case 'returning':
        return NextResponse.json(await getReturningData(from, to));
      case 'checkout': {
        const checkoutData = await getCheckoutData(from, to);
        if (!checkoutData) return NextResponse.json({ error: 'STRIPE_SECRET_KEY not configured' }, { status: 400 });
        return NextResponse.json(checkoutData);
      }
      default:
        return NextResponse.json({ error: 'Unknown section' }, { status: 404 });
    }
  } catch (err: any) {
    console.error(`[analytics/${section}]`, err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

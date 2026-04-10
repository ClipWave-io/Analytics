// IP geolocation using ip-api.com POST /batch endpoint.
// Free tier: 45 batch requests/min, 100 IPs per batch = 4500 IPs/min.
// Cache is process-local; on Railway the dyno is long-lived enough to benefit.

type Geo = { country: string; countryCode: string; city: string };

const cache = new Map<string, Geo>();
const UNKNOWN: Geo = { country: 'Unknown', countryCode: 'XX', city: '' };

function isInvalid(ip: string): boolean {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') return true;
  // Private / reserved ranges — ip-api.com returns "reserved range" anyway
  if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
  if (ip.startsWith('172.')) {
    const n = Number(ip.split('.')[1]);
    if (n >= 16 && n <= 31) return true;
  }
  return false;
}

export async function geolocateIP(ip: string): Promise<Geo> {
  if (isInvalid(ip)) return UNKNOWN;
  if (cache.has(ip)) return cache.get(ip)!;
  const results = await batchGeolocate([ip]);
  return results.get(ip) || UNKNOWN;
}

export async function batchGeolocate(ips: string[]): Promise<Map<string, Geo>> {
  const results = new Map<string, Geo>();
  const toFetch: string[] = [];

  for (const ip of new Set(ips)) {
    if (isInvalid(ip)) {
      results.set(ip, UNKNOWN);
      continue;
    }
    const cached = cache.get(ip);
    if (cached) {
      results.set(ip, cached);
    } else {
      toFetch.push(ip);
    }
  }

  // POST /batch accepts up to 100 IPs per request
  for (let i = 0; i < toFetch.length; i += 100) {
    const chunk = toFetch.slice(i, i + 100);
    try {
      const res = await fetch('http://ip-api.com/batch?fields=status,query,country,countryCode,city', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        for (const ip of chunk) results.set(ip, UNKNOWN);
        continue;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const row of data) {
          const ip: string = row.query;
          const geo: Geo = row.status === 'success'
            ? { country: row.country || 'Unknown', countryCode: row.countryCode || 'XX', city: row.city || '' }
            : UNKNOWN;
          if (geo.country !== 'Unknown') cache.set(ip, geo);
          results.set(ip, geo);
        }
      }
    } catch {
      for (const ip of chunk) results.set(ip, UNKNOWN);
    }
  }

  return results;
}

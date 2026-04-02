// Lightweight IP geolocation using ip-api.com (free, no signup, 45 req/min)
// For production with high volume, replace with MaxMind GeoLite2

const cache = new Map<string, { country: string; countryCode: string; city: string }>();

export async function geolocateIP(ip: string): Promise<{ country: string; countryCode: string; city: string }> {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') {
    return { country: 'Unknown', countryCode: 'XX', city: '' };
  }

  if (cache.has(ip)) return cache.get(ip)!;

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode,city`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { country: 'Unknown', countryCode: 'XX', city: '' };
    const data = await res.json();
    const result = {
      country: data.country || 'Unknown',
      countryCode: data.countryCode || 'XX',
      city: data.city || '',
    };
    cache.set(ip, result);
    return result;
  } catch {
    return { country: 'Unknown', countryCode: 'XX', city: '' };
  }
}

// Batch geolocate unique IPs (respects rate limit)
export async function batchGeolocate(ips: string[]): Promise<Map<string, { country: string; countryCode: string; city: string }>> {
  const unique = [...new Set(ips.filter(ip => ip && ip !== 'unknown'))];
  const results = new Map<string, { country: string; countryCode: string; city: string }>();

  // Process in batches of 40 to stay under rate limit
  for (let i = 0; i < unique.length; i += 40) {
    const batch = unique.slice(i, i + 40);
    const promises = batch.map(async ip => {
      const geo = await geolocateIP(ip);
      results.set(ip, geo);
    });
    await Promise.all(promises);
    if (i + 40 < unique.length) await new Promise(r => setTimeout(r, 1500));
  }

  return results;
}

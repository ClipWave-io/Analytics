import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'dev-secret';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

// Partner accounts: username -> { password env var, redirect path }
const PARTNERS: Record<string, { envKey: string; redirect: string }> = {
  gilam: { envKey: 'GILAM_PASSWORD', redirect: '/partner/gilam' },
};

function sign(payload: string): string {
  return createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a.trim(), 'utf8');
  const bufB = Buffer.from(b.trim(), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export type UserRole = 'admin' | 'partner';

export function validateCredentials(username: string, password: string): { valid: boolean; role: UserRole; redirect: string } {
  // Check admin
  if (ADMIN_PASSWORD && username === ADMIN_USERNAME && safeCompare(ADMIN_PASSWORD, password)) {
    return { valid: true, role: 'admin', redirect: '/dashboard' };
  }

  // Check partners
  const partner = PARTNERS[username.toLowerCase()];
  if (partner) {
    const partnerPw = process.env[partner.envKey];
    if (partnerPw && safeCompare(partnerPw, password)) {
      return { valid: true, role: 'partner', redirect: partner.redirect };
    }
  }

  return { valid: false, role: 'admin', redirect: '/dashboard' };
}

export function createSession(username: string, role: UserRole): string {
  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = `${username}:${role}:${expiry}`;
  return `${payload}:${sign(payload)}`;
}

export function verifySession(token: string): { username: string; role: UserRole } | null {
  const parts = token.split(':');
  if (parts.length === 3) {
    // Legacy format: username:expiry:sig
    const [username, expiryStr, sig] = parts;
    const payload = `${username}:${expiryStr}`;
    const expected = sign(payload);
    const sigBuffer = Buffer.from(sig, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    if (sigBuffer.length !== expectedBuffer.length) return null;
    if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;
    if (Date.now() > Number(expiryStr)) return null;
    return { username, role: 'admin' };
  }
  if (parts.length === 4) {
    // New format: username:role:expiry:sig
    const [username, role, expiryStr, sig] = parts;
    const payload = `${username}:${role}:${expiryStr}`;
    const expected = sign(payload);
    const sigBuffer = Buffer.from(sig, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    if (sigBuffer.length !== expectedBuffer.length) return null;
    if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;
    if (Date.now() > Number(expiryStr)) return null;
    return { username, role: role as UserRole };
  }
  return null;
}

export async function getSession(): Promise<{ username: string; role: UserRole } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('analytics_session')?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireAuth(): Promise<{ username: string; role: UserRole }> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

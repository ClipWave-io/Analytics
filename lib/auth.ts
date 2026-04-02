import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'dev-secret';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

function sign(payload: string): string {
  return createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}

export function validateCredentials(username: string, password: string): boolean {
  if (!ADMIN_PASSWORD) return false;
  const userOk = username === ADMIN_USERNAME;
  const pwBuffer = Buffer.from(ADMIN_PASSWORD.trim(), 'utf8');
  const providedBuffer = Buffer.from(password.trim(), 'utf8');
  if (pwBuffer.length !== providedBuffer.length) return false;
  return userOk && timingSafeEqual(pwBuffer, providedBuffer);
}

export function createSession(username: string): string {
  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = `${username}:${expiry}`;
  return `${payload}:${sign(payload)}`;
}

export function verifySession(token: string): { username: string } | null {
  const parts = token.split(':');
  if (parts.length !== 3) return null;
  const [username, expiryStr, sig] = parts;
  const payload = `${username}:${expiryStr}`;
  const expected = sign(payload);
  const sigBuffer = Buffer.from(sig, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;
  if (Date.now() > Number(expiryStr)) return null;
  return { username };
}

export async function getSession(): Promise<{ username: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('analytics_session')?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireAuth(): Promise<{ username: string }> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

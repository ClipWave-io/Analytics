import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

async function hmacSign(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyToken(token: string): Promise<{ username: string; role: string } | null> {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'dev-secret';
  const parts = token.split(':');

  if (parts.length === 3) {
    const [username, expiryStr, sig] = parts;
    const expected = await hmacSign(`${username}:${expiryStr}`, secret);
    if (sig !== expected) return null;
    if (Date.now() > Number(expiryStr)) return null;
    return { username, role: 'admin' };
  }
  if (parts.length === 4) {
    const [username, role, expiryStr, sig] = parts;
    const expected = await hmacSign(`${username}:${role}:${expiryStr}`, secret);
    if (sig !== expected) return null;
    if (Date.now() > Number(expiryStr)) return null;
    return { username, role };
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.startsWith('/_next') || pathname.includes('.')) return NextResponse.next();

  const session = request.cookies.get('analytics_session')?.value;
  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const user = await verifyToken(session);
  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based access control
  if (user.role === 'partner') {
    if (!pathname.startsWith('/partner') && !pathname.startsWith('/api/partner') && !pathname.startsWith('/api/auth')) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      return NextResponse.redirect(new URL(`/partner/${user.username}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

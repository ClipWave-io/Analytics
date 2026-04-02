import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'dev-secret';
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

function verifyToken(token: string): { username: string; role: string } | null {
  const parts = token.split(':');
  const sign = (p: string) => createHmac('sha256', SESSION_SECRET).update(p).digest('hex');

  if (parts.length === 3) {
    const [username, expiryStr, sig] = parts;
    const payload = `${username}:${expiryStr}`;
    const expected = sign(payload);
    const sigBuf = Buffer.from(sig, 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;
    if (Date.now() > Number(expiryStr)) return null;
    return { username, role: 'admin' };
  }
  if (parts.length === 4) {
    const [username, role, expiryStr, sig] = parts;
    const payload = `${username}:${role}:${expiryStr}`;
    const expected = sign(payload);
    const sigBuf = Buffer.from(sig, 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;
    if (Date.now() > Number(expiryStr)) return null;
    return { username, role };
  }
  return null;
}

export function middleware(request: NextRequest) {
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

  const user = verifyToken(session);
  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based access control
  if (user.role === 'partner') {
    // Partners can only access /partner/* and /api/partner/*
    if (!pathname.startsWith('/partner') && !pathname.startsWith('/api/partner') && !pathname.startsWith('/api/auth')) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      // Redirect partner to their dashboard
      return NextResponse.redirect(new URL(`/partner/${user.username}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from './lib/auth';
export async function proxy(req: NextRequest) {
 const p = req.nextUrl.pathname;
 if (p === '/login' || p.startsWith('/api/auth/') || p.startsWith('/_next/') || p === '/favicon.ico') return NextResponse.next();
 if (await verifySession(req.cookies.get('noc_session')?.value)) return NextResponse.next();
 if (p.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 return NextResponse.redirect(new URL('/login', req.url));
}
export const config = { matcher: ['/((?!_next/static|_next/image).*)'] };

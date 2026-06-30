import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { BETA_ACCESS_COOKIE, isBetaAccessRequired, isValidBetaAccessCode } from '@/lib/beta-access';

export async function GET() {
  if (!isBetaAccessRequired()) {
    return NextResponse.json({ required: false, verified: true });
  }

  const cookieStore = await cookies();
  const verified = cookieStore.get(BETA_ACCESS_COOKIE)?.value === '1';
  return NextResponse.json({ required: true, verified });
}

export async function POST(request: Request) {
  if (!isBetaAccessRequired()) {
    const res = NextResponse.json({ ok: true, required: false });
    res.cookies.set(BETA_ACCESS_COOKIE, '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2,
      path: '/',
    });
    return res;
  }

  const body = await request.json().catch(() => ({}));
  const code = typeof body?.code === 'string' ? body.code : '';

  if (!isValidBetaAccessCode(code)) {
    return NextResponse.json({ error: 'Invalid beta code.' }, { status: 403 });
  }

  const res = NextResponse.json({ ok: true, required: true });
  res.cookies.set(BETA_ACCESS_COOKIE, '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 2,
    path: '/',
  });
  return res;
}

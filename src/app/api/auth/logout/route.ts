
import { NextRequest, NextResponse } from 'next/server';
import { serialize } from 'cookie';
import { revokeRefreshToken } from '@/lib/refresh-tokens';

export async function POST(request: NextRequest) {
  let refreshToken;
  try {
    const body = await request.json();
    refreshToken = body.refreshToken;
  } catch {}

  if (refreshToken) {
    await revokeRefreshToken(refreshToken);

  const cookie = serialize('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Set-Cookie': cookie,
      'Content-Type': 'application/json',
    },
  });
}
}

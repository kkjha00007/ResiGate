import { NextRequest, NextResponse } from 'next/server';
import { getRefreshToken, createRefreshToken, revokeRefreshToken } from '@/lib/refresh-tokens';
import { getUserById } from '@/lib/server-utils';
import { createJWT } from '@/lib/server-utils';

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();
    if (!refreshToken) {
      return NextResponse.json({ message: 'Refresh token required' }, { status: 400 });
    }
    const tokenRecord = await getRefreshToken(refreshToken);
    if (!tokenRecord || tokenRecord.revoked) {
      return NextResponse.json({ message: 'Invalid or revoked refresh token' }, { status: 401 });
    }
    if (new Date(tokenRecord.expiresAt) < new Date()) {
      return NextResponse.json({ message: 'Refresh token expired' }, { status: 401 });
    }
    // Get user
    const user = await getUserById(tokenRecord.userId, tokenRecord.userId); // societyId not needed for JWT
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    // Rotate refresh token: revoke old, issue new
    await revokeRefreshToken(refreshToken);
    const newRefreshTokenRecord = await createRefreshToken(user.id, undefined, 90);
    const newRefreshToken = newRefreshTokenRecord.id;
    // Issue new JWT
    const token = await createJWT(user, '60m');
    return NextResponse.json({ token, refreshToken: newRefreshToken });
  } catch (err) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

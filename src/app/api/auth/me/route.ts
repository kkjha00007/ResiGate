import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/server-utils';
import { getUserById } from '@/lib/server-utils';

export async function GET(req: NextRequest) {
  // Use the built-in cookies API for App Router
  const token = req.cookies.get('session')?.value;
  if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  const payload = await verifyJWT(token);
  if (!payload || typeof payload !== 'object' || !('userId' in payload) || !('societyId' in payload)) {
    return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
  }
  const user = await getUserById(payload.userId, payload.societyId);
  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
  // Remove password before returning
  const { password, ...userProfile } = user;
  // Attach exp from JWT payload if present
  return NextResponse.json({ ...userProfile, exp: payload.exp });
}

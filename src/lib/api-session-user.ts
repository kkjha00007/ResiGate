// src/lib/api-session-user.ts
// Server-only utility for API routes to get the current user (session-based)
import { cookies } from 'next/headers';
import { verifyJWT, getUserById } from './utils';

export async function getApiSessionUser(req?: any) {
  let token: string | undefined;
  if (req && typeof req.cookies?.get === 'function') {
    // App Router API route: req.cookies.get('session')?.value
    token = req.cookies.get('session')?.value;
  } else {
    // Fallback: use next/headers cookies() (for edge/server components)
    const cookiesObj = await cookies();
    token = cookiesObj.get('session')?.value;
  }
  if (!token) return null;
  const payload = await verifyJWT(token);
  if (!payload || typeof payload !== 'object' || !('userId' in payload) || !('societyId' in payload)) {
    return null;
  }
  const user = await getUserById(payload.userId, payload.societyId);
  if (!user) return null;
  // Remove password before returning
  const { password, ...userProfile } = user;
  // Attach exp from JWT payload if present
  return { ...userProfile, exp: payload.exp };
}

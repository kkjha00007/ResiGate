// src/lib/api-session-user.ts
// Server-only utility for API routes to get the current user (session-based)
import { cookies } from 'next/headers';
import { verifyJWT, getUserById } from './server-utils';

export async function getApiSessionUser(req?: any) {
  let token: string | undefined;
  // 1. Check Authorization header (for mobile/JWT clients)
  if (req && typeof req.headers?.get === 'function') {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  } else if (typeof req?.headers === 'object' && req.headers?.authorization) {
    // Node.js/Express style headers
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }
  // 2. Fallback to session cookie (for web)
  if (!token && req && typeof req.cookies?.get === 'function') {
    token = req.cookies.get('session')?.value;
  } else if (!token) {
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

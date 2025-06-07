import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, savePasswordResetToken, sendPasswordResetEmail } from '@/lib/auth-password-reset';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
  }
  // Find user by email
  const user = await getUserByEmail(email);
  if (!user) {
    // Do not reveal if user exists
    return NextResponse.json({ message: 'If your email is registered, a reset link has been sent.' });
  }
  // Generate token
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 1000 * 60 * 30; // 30 min
  await savePasswordResetToken(user.id, token, expires);
  await sendPasswordResetEmail(email, token);
  return NextResponse.json({ message: 'If your email is registered, a reset link has been sent.' });
}

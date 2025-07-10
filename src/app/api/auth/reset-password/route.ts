import { NextRequest, NextResponse } from 'next/server';
import { getUserByResetToken, removePasswordResetToken, updateUserPassword } from '@/lib/auth-password-reset';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const { token, password } = await request.json();
  if (!token || !password) {
    return NextResponse.json({ message: 'Token and new password are required.' }, { status: 400 });
  }
  const user = await getUserByResetToken(token);
  if (!user) {
    return NextResponse.json({ message: 'Invalid or expired token.' }, { status: 400 });
  }
  const hash = await bcrypt.hash(password, 10);
  await updateUserPassword(user.id, user.societyId || '', hash);
  await removePasswordResetToken(user.id, user.societyId || '');
  return NextResponse.json({ message: 'Password has been reset.' });
}

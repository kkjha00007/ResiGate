import { NextRequest, NextResponse } from 'next/server';
import { getUserByPhone, verifyPasswordResetOtp, savePasswordResetToken } from '@/lib/auth-password-reset';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const { phone, otp } = await request.json();
  if (!phone || !otp) {
    return NextResponse.json({ message: 'Invalid or expired OTP' });
  }
  // Find user by phone
  const user = await getUserByPhone(phone);
  if (!user) {
    return NextResponse.json({ message: 'Invalid or expired OTP' });
  }
  // Verify OTP
  const valid = await verifyPasswordResetOtp(user, otp);
  if (!valid) {
    return NextResponse.json({ message: 'Invalid or expired OTP' });
  }
  // Generate secure reset token
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 1000 * 60 * 15; // 15 min
  await savePasswordResetToken(user.id, user.societyId || '', token, expires);
  return NextResponse.json({ token });
  // Generate mock OTP from phone: 1st, 3rd, 5th, 7th, 9th digit + '0'
  function getMockOtp(phone: string) {
    return (
      (phone[0] || '') +
      (phone[2] || '') +
      (phone[4] || '') +
      (phone[6] || '') +
      (phone[8] || '') +
      '0'
    );
  }
  // Check OTP using mock logic
  const expectedOtp = getMockOtp(phone);
  if (otp !== expectedOtp) {
    return NextResponse.json({ message: 'Invalid or expired OTP' });
  }
}

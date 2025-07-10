import { NextRequest, NextResponse } from 'next/server';
import { getUserByPhone, savePasswordResetOtp } from '@/lib/auth-password-reset';

export async function POST(request: NextRequest) {
  const { phone } = await request.json();
  if (!phone) {
    return NextResponse.json({ message: 'OTP sent' });
  }
  // Find user by phone
  const user = await getUserByPhone(phone);
  if (!user) {
    // Do not reveal if user exists
    return NextResponse.json({ message: 'OTP sent' });
  }
  // Rate limit check (implement in savePasswordResetOtp)
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
  const otp = getMockOtp(phone);
  const expires = Date.now() + 1000 * 60 * 10; // 10 min
  await savePasswordResetOtp(user.id, user.societyId || '', otp, expires);
  // Do not actually send SMS, just mock
  // await sendPasswordResetOtp(phone, otp);
  return NextResponse.json({ message: 'OTP sent' });
}

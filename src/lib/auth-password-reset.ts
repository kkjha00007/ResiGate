import { getUsersContainer } from './cosmosdb';
import type { User } from './types';

import bcrypt from 'bcryptjs';
import { logAuditAction } from './server-utils';
import { sendEmail } from './server-utils';

export async function getUserByEmail(email: string): Promise<User | null> {
  const container = getUsersContainer();
  const query = {
    query: 'SELECT * FROM c WHERE c.email = @email',
    parameters: [{ name: '@email', value: email }],
  };
  const { resources } = await container.items.query<User>(query).fetchAll();
  return resources.length > 0 ? resources[0] : null;
}

// Save password reset token and expiry for a user (with correct partition key)
export async function savePasswordResetToken(userId: string, societyId: string, token: string, expires: number): Promise<void> {
  const container = getUsersContainer();
  // Patch user with token and expiry using correct partition key
  await container.item(userId, societyId).patch([
    { op: 'add', path: '/passwordResetToken', value: token },
    { op: 'add', path: '/passwordResetTokenExpiry', value: expires },
  ]);
}

// Remove password reset token and expiry for a user (with correct partition key)
export async function removePasswordResetToken(userId: string, societyId: string): Promise<void> {
  const container = getUsersContainer();
  await container.item(userId, societyId).patch([
    { op: 'remove', path: '/passwordResetToken' },
    { op: 'remove', path: '/passwordResetTokenExpiry' },
  ]);
}

// Update user password (with correct partition key)
export async function updateUserPassword(userId: string, societyId: string, hash: string): Promise<void> {
  const container = getUsersContainer();
  await container.item(userId, societyId).patch([
    { op: 'replace', path: '/password', value: hash },
  ]);
}

export async function getUserByResetToken(token: string): Promise<User | null> {
  const container = getUsersContainer();
  const now = Date.now();
  const query = {
    query: 'SELECT * FROM c WHERE c.passwordResetToken = @token AND c.passwordResetTokenExpiry > @now',
    parameters: [
      { name: '@token', value: token },
      { name: '@now', value: now },
    ],
  };
  const { resources } = await container.items.query<User>(query).fetchAll();
  return resources.length > 0 ? resources[0] : null;
}

// --- PHONE/OTP PASSWORD RESET HELPERS ---

// 1. Lookup user by phone (primary or secondary)
export async function getUserByPhone(phone: string): Promise<User | null> {
  const container = getUsersContainer();
  const query = {
    query: 'SELECT * FROM c WHERE c.phone = @phone OR c.secondaryPhoneNumber1 = @phone OR c.secondaryPhoneNumber2 = @phone',
    parameters: [{ name: '@phone', value: phone }],
  };
  const { resources } = await container.items.query<User>(query).fetchAll();
  return resources.length > 0 ? resources[0] : null;
}

// 2. Save OTP (hashed) and expiry, with rate limiting (max 5 per hour)
export async function savePasswordResetOtp(userId: string, societyId: string, otp: string, expires: number): Promise<void> {
  const container = getUsersContainer();
  // Fetch user to check rate limit and get partition key
  const { resources } = await container.items.query<User>({
    query: 'SELECT * FROM c WHERE c.id = @id',
    parameters: [{ name: '@id', value: userId }],
  }).fetchAll();
  const user = resources[0];
  if (!user) throw new Error('User not found');
  const now = Date.now();
  let otpRequests = (user as any)?.otpRequests || [];
  otpRequests = otpRequests.filter((t: number) => t > now - 60 * 60 * 1000);
  if (otpRequests.length >= 5) {
    throw new Error('Too many OTP requests. Please try again later.');
  }
  otpRequests.push(now);
  const otpHash = await bcrypt.hash(otp, 8);
  await container.item(userId, societyId).patch([
    { op: 'add', path: '/passwordResetOtp', value: otpHash },
    { op: 'add', path: '/passwordResetOtpExpiry', value: expires },
    { op: 'add', path: '/otpRequests', value: otpRequests },
  ]);
  // Audit log (fill required fields)
  await logAuditAction({
    societyId: user?.societyId || '',
    userId,
    userName: user?.name || '',
    userRole: user?.primaryRole || 'member_resident',
    action: 'password_reset_otp_requested',
    targetType: 'User',
    targetId: userId,
    details: { count: otpRequests.length },
  });
}

// 3. Send OTP via SMS (stub, replace with real SMS provider)
export async function sendPasswordResetOtp(phone: string, otp: string): Promise<void> {
  // TODO: Integrate with SMS provider (e.g., Twilio)
  console.log(`Password reset OTP for ${phone}: ${otp}`);
}

// 4. Verify OTP (check hash and expiry)
export async function verifyPasswordResetOtp(user: any, otp: string): Promise<boolean> {
  if (!user.passwordResetOtp || !user.passwordResetOtpExpiry) return false;
  if (Date.now() > user.passwordResetOtpExpiry) return false;
  const match = await bcrypt.compare(otp, user.passwordResetOtp);
  if (!match) return false;
  // Clear OTP after successful verification
  const container = getUsersContainer();
  await container.item(user.id, user.societyId).patch([
    { op: 'remove', path: '/passwordResetOtp' },
    { op: 'remove', path: '/passwordResetOtpExpiry' },
  ]);
  // Audit log (fill required fields)
  await logAuditAction({
    societyId: user?.societyId || '',
    userId: user.id,
    userName: user?.name || '',
    userRole: user?.primaryRole || 'member_resident',
    action: 'password_reset_otp_verified',
    targetType: 'User',
    targetId: user.id,
    details: {},
  });
  return true;
}

// 5. Override sendPasswordResetEmail to use real email sender
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    templateId: process.env.SENDGRID_RESET_TEMPLATE_ID,
    dynamicTemplateData: { reset_link: resetLink }
  });
}

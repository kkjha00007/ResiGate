// src/app/api/billing/bills/email/send.ts
// Helper for sending bill emails and logging the attempt
import { BillEmailLog, MaintenanceBill, User } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
// import nodemailer or your email library here

// Dummy email sender (replace with real implementation)
async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  // TODO: Integrate with real email service (e.g., nodemailer, SendGrid)
  if (!to) return { success: false, error: 'No email address provided' };
  // Simulate success
  return { success: true };
}

// Main function to send bill email and log the attempt
export async function sendBillEmailAndLog({
  bill,
  user,
  adminUserId,
  logToDb,
}: {
  bill: MaintenanceBill;
  user: User;
  adminUserId: string;
  logToDb: (log: BillEmailLog) => Promise<void>;
}): Promise<BillEmailLog> {
  const now = new Date().toISOString();
  let log: BillEmailLog = {
    id: uuidv4(),
    billId: bill.id,
    societyId: bill.societyId,
    flatNumber: bill.flatNumber,
    userId: user.id,
    email: user.email,
    sentAt: now,
    status: 'sent',
  };

  if (!user.email) {
    log.status = 'no_email';
    log.errorMessage = 'Email not configured for resident.';
    await logToDb(log);
    return log;
  }

  // Compose email
  const subject = `Your Society Maintenance Bill for ${bill.period}`;
  const html = `<p>Dear ${user.name},</p><p>Your maintenance bill for flat <b>${bill.flatNumber}</b> for the period <b>${bill.period}</b> is <b>₹${bill.amount}</b>.<br>Due Date: <b>${bill.dueDate}</b></p><p>Please pay before the due date to avoid late fees.</p>`;

  // Send email
  const result = await sendEmail(user.email, subject, html);
  if (!result.success) {
    log.status = 'failed';
    log.errorMessage = result.error || 'Unknown error';
  }
  await logToDb(log);
  return log;
}

// src/app/api/billing/bills/reminders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMaintenanceBillsContainer, getUsersContainer } from '@/lib/cosmosdb';
import { createNotification } from '@/lib/notifications';
import { sendEmail } from '@/lib/server-utils';

// POST: Trigger reminders for unpaid/overdue bills (admin only, or scheduled job)
export async function POST(request: NextRequest) {
  const { societyId, dryRun } = await request.json();
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  const billsContainer = getMaintenanceBillsContainer();
  const usersContainer = getUsersContainer();
  // Find all unpaid/overdue bills
  const { resources: bills } = await billsContainer.items.query({
    query: 'SELECT * FROM c WHERE c.societyId = @societyId AND (c.status = "unpaid" OR c.status = "overdue")',
    parameters: [{ name: '@societyId', value: societyId }],
  }).fetchAll();
  let remindersSent = 0;
  for (const bill of bills) {
    // Find user for this bill
    const { resource: user } = await usersContainer.item(bill.userId, societyId).read();
    if (!user) continue;
    if (!dryRun) {
      await createNotification({
        userId: bill.userId,
        type: 'billing',
        title: bill.status === 'overdue' ? 'Overdue Maintenance Bill Reminder' : 'Maintenance Bill Reminder',
        message: `Your maintenance bill for period ${bill.period} is ${bill.status}. Please pay before the due date to avoid penalties.`,
        link: '/dashboard/my-bills',
      });
      // Send email reminder if user has email
      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: bill.status === 'overdue' ? 'Overdue Maintenance Bill Reminder' : 'Maintenance Bill Reminder',
          text: `Dear ${user.name},\n\nYour maintenance bill for period ${bill.period} is currently ${bill.status}. Please pay before the due date to avoid penalties.\n\nLogin to the portal for details.\n\n- ${societyId} Management`,
        });
      }
    }
    remindersSent++;
  }
  return NextResponse.json({ message: `Reminders processed`, remindersSent, dryRun: !!dryRun });
}

// GET: Allow scheduled/cron jobs to trigger reminders automatically (e.g., via serverless cron)
export async function GET(request: NextRequest) {
  const societyId = request.nextUrl.searchParams.get('societyId');
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  // Reuse POST logic, but as a GET for scheduled jobs
  const fakeRequest = { json: async () => ({ societyId, dryRun: false }) } as NextRequest;
  return await POST(fakeRequest);
}

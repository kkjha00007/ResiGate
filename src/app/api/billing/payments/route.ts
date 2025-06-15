// src/app/api/billing/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPaymentsContainer, getMaintenanceBillsContainer, getUsersContainer } from '@/lib/cosmosdb';
import { Payment, MaintenanceBill } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { createNotification, sendNotificationToAdmins } from '@/lib/notifications';

// GET: List payments (with optional filters)
export async function GET(request: NextRequest) {
  // TODO: Implement fetch payments by societyId, userId, billId, etc.
  return NextResponse.json({ message: 'List payments - to be implemented' });
}

// POST: Create a new payment (supports advance payments)
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid or missing JSON body' }, { status: 400 });
  }
  const { societyId, flatNumber, userId, amount, paymentDate, mode, referenceNumber, notes, billId } = body;
  if (!societyId || !flatNumber || !userId || !amount || !paymentDate || !mode) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }
  const paymentsContainer = getPaymentsContainer();
  const billsContainer = getMaintenanceBillsContainer();
  const usersContainer = getUsersContainer();
  const payment: Payment = {
    id: uuidv4(),
    societyId,
    flatNumber,
    userId,
    amount,
    paymentDate,
    mode,
    referenceNumber,
    notes,
    billId,
  };
  await paymentsContainer.items.create(payment);
  // If billId is provided, update that bill
  if (billId) {
    const { resource: bill } = await billsContainer.item(billId, societyId).read<MaintenanceBill>();
    if (bill) {
      bill.paidAmount = (bill.paidAmount || 0) + amount;
      if ((bill.paidAmount || 0) >= bill.amount) {
        bill.status = 'paid';
        bill.paidAt = paymentDate;
      } else {
        bill.status = 'partially_paid';
      }
      bill.paymentIds = [...(bill.paymentIds || []), payment.id];
      await billsContainer.items.upsert(bill);
    }
    await createNotification({
      userId,
      type: 'payment',
      title: 'Payment Received',
      message: `Your payment of ₹${amount} for bill ${billId} has been received.`,
      link: '/dashboard/my-bills',
    });
    await sendNotificationToAdmins({
      societyId,
      type: 'payment',
      title: 'Payment Received',
      message: `Payment of ₹${amount} received for bill ${billId} (flat ${flatNumber}).`,
      link: '/dashboard/admin/manage-billing',
    });
    return NextResponse.json({ message: 'Payment recorded', payment });
  }
  // Advance payment: apply to future unpaid bills for this flat
  const { resources: futureBills } = await billsContainer.items.query({
    query: 'SELECT * FROM c WHERE c.societyId = @societyId AND c.flatNumber = @flatNumber AND (c.status = "unpaid" OR c.status = "overdue" OR c.status = "partially_paid") ORDER BY c.period ASC',
    parameters: [
      { name: '@societyId', value: societyId },
      { name: '@flatNumber', value: flatNumber }
    ]
  }).fetchAll();
  let remaining = amount;
  for (const bill of futureBills) {
    const due = bill.amount - (bill.paidAmount || 0);
    if (remaining <= 0) break;
    const pay = Math.min(remaining, due);
    bill.paidAmount = (bill.paidAmount || 0) + pay;
    if ((bill.paidAmount || 0) >= bill.amount) {
      bill.status = 'paid';
      bill.paidAt = paymentDate;
    } else {
      bill.status = 'partially_paid';
    }
    bill.paymentIds = [...(bill.paymentIds || []), payment.id];
    await billsContainer.items.upsert(bill);
    remaining -= pay;
  }
  // Update user's creditBalance with any remaining advance
  const { resource: user } = await usersContainer.item(userId, societyId).read<any>();
  if (user) {
    user.creditBalance = Math.round(((user.creditBalance || 0) + remaining) * 100) / 100;
    await usersContainer.items.upsert(user);
  }
  await createNotification({
    userId,
    type: 'payment',
    title: 'Advance Payment Received',
    message: `Your advance payment of ₹${amount} has been received and will be applied to future bills.`,
    link: '/dashboard/my-bills',
  });
  await sendNotificationToAdmins({
    societyId,
    type: 'payment',
    title: 'Advance Payment Received',
    message: `Advance payment of ₹${amount} received for flat ${flatNumber}.`,
    link: '/dashboard/admin/manage-billing',
  });
  return NextResponse.json({ message: 'Advance payment recorded', payment, appliedToBills: futureBills.map(b => b.id), creditBalance: user?.creditBalance });
}

// PUT: Update a payment
export async function PUT(request: NextRequest) {
  // TODO: Implement payment update
  return NextResponse.json({ message: 'Update payment - to be implemented' });
}

// DELETE: Delete a payment
export async function DELETE(request: NextRequest) {
  // TODO: Implement payment deletion
  return NextResponse.json({ message: 'Delete payment - to be implemented' });
}

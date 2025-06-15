// src/app/api/billing/bills/email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendBillEmailAndLog } from './send';
import { BillEmailLog, MaintenanceBill, User } from '@/lib/types';
// import your DB helpers here

// Dummy DB log function (replace with real DB logic)
async function logToDb(log: BillEmailLog) {
  // TODO: Save log to CosmosDB or your database
  // Example: await db.collection('BillEmailLogs').insertOne(log);
  return;
}

// Dummy fetchers (replace with real DB logic)
async function getBillById(billId: string): Promise<MaintenanceBill | null> {
  // TODO: Fetch bill from DB
  return null;
}
async function getUserById(userId: string): Promise<User | null> {
  // TODO: Fetch user from DB
  return null;
}

// POST: Email a bill to a resident
export async function POST(request: NextRequest) {
  const { billId, userId, adminUserId } = await request.json();
  if (!billId || !userId || !adminUserId) {
    return NextResponse.json({ message: 'billId, userId, and adminUserId are required' }, { status: 400 });
  }
  const bill = await getBillById(billId);
  const user = await getUserById(userId);
  if (!bill || !user) {
    return NextResponse.json({ message: 'Bill or user not found' }, { status: 404 });
  }
  const log = await sendBillEmailAndLog({ bill, user, adminUserId, logToDb });
  return NextResponse.json(log);
}

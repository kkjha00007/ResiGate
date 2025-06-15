// src/app/api/billing/bills/reminders/schedule/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUsersContainer, getSocietySettingsContainer } from '@/lib/cosmosdb';
import { BillReminderSchedule } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// Store schedules in SocietySettings (per society, per user)

export async function GET(request: NextRequest) {
  const societyId = request.nextUrl.searchParams.get('societyId');
  const userId = request.nextUrl.searchParams.get('userId');
  if (!societyId || !userId) {
    return NextResponse.json({ message: 'societyId and userId required' }, { status: 400 });
  }
  const settingsContainer = getSocietySettingsContainer();
  const { resource } = await settingsContainer.item(societyId, societyId).read<any>();
  const schedules = resource?.billReminderSchedules || [];
  const userSchedule = schedules.find((s: BillReminderSchedule) => s.userId === userId);
  return NextResponse.json({ schedule: userSchedule || null });
}

export async function POST(request: NextRequest) {
  const { societyId, userId, dayOfMonth, hour, minute, enabled } = await request.json();
  if (!societyId || !userId || !dayOfMonth || hour === undefined || minute === undefined) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }
  const settingsContainer = getSocietySettingsContainer();
  let { resource } = await settingsContainer.item(societyId, societyId).read<any>();
  if (!resource) {
    resource = { id: societyId, societyId, billReminderSchedules: [] };
  }
  if (!resource.billReminderSchedules) resource.billReminderSchedules = [];
  // Remove old schedule for this user
  resource.billReminderSchedules = resource.billReminderSchedules.filter((s: BillReminderSchedule) => s.userId !== userId);
  // Add new schedule
  resource.billReminderSchedules.push({ userId, societyId, dayOfMonth, hour, minute, enabled });
  await settingsContainer.items.upsert(resource);
  return NextResponse.json({ message: 'Schedule saved', schedule: { userId, societyId, dayOfMonth, hour, minute, enabled } });
}

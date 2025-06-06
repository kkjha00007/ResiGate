import { NextRequest, NextResponse } from 'next/server';
import { getUserNotifications, markNotificationRead } from '@/lib/notifications';

// GET /api/notifications?userId=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }
  const notifications = await getUserNotifications(userId);
  return NextResponse.json(notifications);
}

// POST /api/notifications/mark-read
export async function POST(request: NextRequest) {
  const { notificationId } = await request.json();
  if (!notificationId) {
    return NextResponse.json({ error: 'Missing notificationId' }, { status: 400 });
  }
  const updated = await markNotificationRead(notificationId);
  if (!updated) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

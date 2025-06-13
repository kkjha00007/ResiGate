import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getApiSessionUser } from '@/lib/api-session-user';
import { sendNotificationToAdmins } from '@/lib/notifications';
import type { SOSAlert } from '@/lib/types';

// SOSAlert type will be added to types.ts

export async function POST(req: NextRequest) {
  try {
    const user = await getApiSessionUser();
    if (!user || !user.societyId || user.role === 'societyAdmin' || user.role === 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const { message } = await req.json();
    // Rate limiting logic can be added here
    const sosAlert: SOSAlert = {
      id: uuidv4(),
      societyId: user.societyId,
      userId: user.id,
      userName: user.name,
      flatNumber: user.flatNumber || '',
      message: message || '',
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    // Use the dedicated SOSAlerts container
    const container = (await import('@/lib/cosmosdb')).getSOSAlertsContainer();
    await container.items.create(sosAlert);
    // Notify all admins in the society
    await sendNotificationToAdmins({
      societyId: user.societyId,
      type: 'SOS_ALERT',
      title: 'SOS Alert',
      message: `${user.name} (Flat ${user.flatNumber}) triggered an SOS!`,
      link: '/dashboard/admin/sos-alerts',
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send SOS' }, { status: 500 });
  }
}

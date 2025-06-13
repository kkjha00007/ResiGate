import { NextRequest, NextResponse } from 'next/server';
import { getApiSessionUser } from '@/lib/api-session-user';
import { getSOSAlertsContainer } from '@/lib/cosmosdb';
import type { SOSAlert } from '@/lib/types';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getApiSessionUser();
    if (!user || (user.role !== 'societyAdmin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const { status, comment } = await req.json();
    if (!['active', 'acknowledged', 'resolved'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    const container = getSOSAlertsContainer();
    // Find the alert by id to get the correct partition key (societyId)
    const query = {
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: params.id }],
    };
    const { resources } = await container.items.query<SOSAlert>(query).fetchAll();
    const alert = resources[0];
    if (!alert) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    // Ensure comments array is always present
    if (!Array.isArray(alert.comments)) alert.comments = [];
    alert.status = status;
    if (comment && typeof comment === 'string' && comment.trim()) {
      alert.comments.push({
        by: user.name,
        byRole: user.role,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      });
    }
    await container.item(alert.id, alert.societyId).replace(alert);
    return NextResponse.json(alert); // Return updated alert so frontend can update UI
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

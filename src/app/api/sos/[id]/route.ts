import { NextRequest, NextResponse } from 'next/server';
import { getApiSessionUser } from '@/lib/api-session-user';
import { getSOSAlertsContainer } from '@/lib/cosmosdb';
import type { SOSAlert } from '@/lib/types';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getApiSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
    return NextResponse.json(alert);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch SOS alert' }, { status: 500 });
  }
}

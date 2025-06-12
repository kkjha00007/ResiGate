// src/app/api/society-invites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSocietyInvitesContainer } from '@/lib/cosmosdb';
import { getApiSessionUser } from '@/lib/api-session-user';

// Only SuperAdmin can access
export async function GET(request: NextRequest) {
  const user = await getApiSessionUser();
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  try {
    const container = getSocietyInvitesContainer();
    const { resources } = await container.items.query('SELECT * FROM c ORDER BY c.createdAt DESC').fetchAll();
    return NextResponse.json(resources);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch society invites' }, { status: 500 });
  }
}

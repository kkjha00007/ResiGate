// src/app/api/society-invites/[inviteId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSocietyInvitesContainer } from '@/lib/cosmosdb';
import { getApiSessionUser } from '@/lib/api-session-user';

export async function PATCH(request: NextRequest, { params }: { params: { inviteId: string } }) {
  const user = await getApiSessionUser();
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const { status, comment } = await request.json();
  if (!status) {
    return NextResponse.json({ error: 'Missing status' }, { status: 400 });
  }
  try {
    const container = getSocietyInvitesContainer();
    // Find the invite by id
    const { resource: invite } = await container.item(params.inviteId, params.inviteId).read();
    if (!invite) {
      // Try to find by query (if partition key is not id)
      const { resources } = await container.items.query({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: params.inviteId }],
      }).fetchAll();
      if (!resources.length) return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
      const doc = resources[0];
      doc.status = status;
      if (typeof comment !== 'undefined') doc.comment = comment;
      await container.item(doc.id, doc.id).replace(doc);
      return NextResponse.json({ success: true });
    }
    invite.status = status;
    if (typeof comment !== 'undefined') invite.comment = comment;
    await container.item(invite.id, invite.id).replace(invite);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update status/comment' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getApiSessionUser } from '@/lib/api-session-user';
import { getHelpDeskRequestsContainer } from '@/lib/cosmosdb';

// POST: Add a comment to a HelpDesk request (admin or societyAdmin)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getApiSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = params;
  const container = getHelpDeskRequestsContainer();
  // First, query for the item to get its societyId
  const { resources } = await container.items.query({
    query: 'SELECT * FROM c WHERE c.id = @id',
    parameters: [{ name: '@id', value: id }],
  }).fetchAll();
  const resource = resources[0];
  if (!resource) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // Only admin or societyAdmin can comment
  if (user.role !== 'superadmin' && user.role !== 'societyAdmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json();
  const text = body.text || body.comment;
  if (!text) return NextResponse.json({ error: 'Missing comment' }, { status: 400 });
  const comment = {
    text,
    authorId: user.id,
    authorName: user.name,
    createdAt: new Date().toISOString(),
  };
  resource.comments = Array.isArray(resource.comments) ? resource.comments : [];
  resource.comments.push(comment);
  resource.updatedAt = new Date().toISOString();
  await container.item(id, resource.societyId).replace(resource);
  return NextResponse.json(resource); // Return updated HelpDesk request for UI update
}

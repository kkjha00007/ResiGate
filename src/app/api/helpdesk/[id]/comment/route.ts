import { NextRequest, NextResponse } from 'next/server';
import { getApiSessionUser } from '@/lib/api-session-user';
import { getHelpDeskRequestsContainer } from '@/lib/cosmosdb';

// POST: Add a comment to a HelpDesk request (admin only for now)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getApiSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = params;
  const container = getHelpDeskRequestsContainer();
  const { resource } = await container.item(id, id).read();
  if (!resource) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // Only admin can comment for now
  if (user.role !== 'superadmin' && user.role !== 'societyAdmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json();
  if (!body.comment) return NextResponse.json({ error: 'Missing comment' }, { status: 400 });
  const comment = {
    by: user.name,
    byRole: user.role,
    comment: body.comment,
    createdAt: new Date().toISOString(),
  };
  resource.comments = Array.isArray(resource.comments) ? resource.comments : [];
  resource.comments.push(comment);
  resource.updatedAt = new Date().toISOString();
  await container.item(id, id).replace(resource);
  return NextResponse.json({ success: true, comment });
}

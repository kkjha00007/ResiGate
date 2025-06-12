import { NextRequest, NextResponse } from 'next/server';
import { getApiSessionUser } from '@/lib/api-session-user';
import { getHelpDeskRequestsContainer } from '@/lib/cosmosdb';

// GET: Fetch a single HelpDesk request by ID (admin or owner only)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getApiSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = params;
  const container = getHelpDeskRequestsContainer();
  // Query for the item to get its societyId
  const { resources } = await container.items.query({
    query: 'SELECT * FROM c WHERE c.id = @id',
    parameters: [{ name: '@id', value: id }]
  }).fetchAll();
  const resource = resources[0];
  if (!resource) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // Only owner or admin of same society can view
  const isAdmin = user.role === 'superadmin' || (user.role === 'societyAdmin' && user.societyId === resource.societyId);
  if (resource.userId !== user.id && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json(resource);
}

// PUT: Update (edit/resolve) a HelpDesk request
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getApiSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = params;
  const container = getHelpDeskRequestsContainer();
  // Query for the item to get its societyId
  const { resources } = await container.items.query({
    query: 'SELECT * FROM c WHERE c.id = @id',
    parameters: [{ name: '@id', value: id }]
  }).fetchAll();
  const resource = resources[0];
  if (!resource) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const isAdmin = user.role === 'superadmin' || (user.role === 'societyAdmin' && user.societyId === resource.societyId);
  if (resource.userId !== user.id && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json();
  // Allow editing description/category/urgent by owner, status by admin
  if (resource.userId === user.id) {
    if (body.description !== undefined) resource.description = body.description;
    if (body.category !== undefined) resource.category = body.category;
    if (body.urgent !== undefined) resource.urgent = body.urgent;
  }
  if (isAdmin && body.status) {
    resource.status = body.status;
  }
  resource.updatedAt = new Date().toISOString();
  await container.item(id, resource.societyId).replace(resource);
  return NextResponse.json(resource);
}

// DELETE: Delete a HelpDesk request (owner or admin)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getApiSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = params;
  const container = getHelpDeskRequestsContainer();
  // Query for the item to get its societyId
  const { resources } = await container.items.query({
    query: 'SELECT * FROM c WHERE c.id = @id',
    parameters: [{ name: '@id', value: id }]
  }).fetchAll();
  const resource = resources[0];
  if (!resource) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const isAdmin = user.role === 'superadmin' || (user.role === 'societyAdmin' && user.societyId === resource.societyId);
  if (resource.userId !== user.id && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await container.item(id, resource.societyId).delete();
  return NextResponse.json({ success: true });
}

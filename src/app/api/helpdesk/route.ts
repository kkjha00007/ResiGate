import { NextRequest, NextResponse } from 'next/server';
import { getApiSessionUser } from '@/lib/api-session-user';
import { getHelpDeskRequestsContainer } from '@/lib/cosmosdb';
import { v4 as uuidv4 } from 'uuid';

// Resident creates a new helpdesk request
export async function POST(request: NextRequest) {
  const user = await getApiSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const data = await request.formData();
  const category = data.get('category');
  const description = data.get('description');
  const urgent = data.get('urgent') === 'true';
  const flatNumber = user.flatNumber;
  const document = data.get('document'); // File
  const photo = data.get('photo'); // File
  // TODO: Save files to storage and get URLs
  // For now, just store file names
  const docUrl = document && typeof document === 'object' ? document.name : '';
  const photoUrl = photo && typeof photo === 'object' ? photo.name : '';
  const helpdeskRequest = {
    id: uuidv4(),
    userId: user.id,
    userName: user.name,
    flatNumber,
    category,
    description,
    urgent,
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    documentUrl: docUrl,
    photoUrl: photoUrl,
    comments: [],
    societyId: user.societyId,
  };
  const container = getHelpDeskRequestsContainer();
  await container.items.create(helpdeskRequest);
  return NextResponse.json({ success: true });
}

// Resident fetches their own requests (open/resolved)
export async function GET(request: NextRequest) {
  const user = await getApiSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const status = request.nextUrl.searchParams.get('status');
  const container = getHelpDeskRequestsContainer();
  let query = 'SELECT * FROM c WHERE c.userId = @userId';
  const params = [{ name: '@userId', value: user.id }];
  if (status) {
    query += ' AND c.status = @status';
    params.push({ name: '@status', value: status });
  }
  query += ' ORDER BY c.createdAt DESC';
  const { resources } = await container.items.query({ query, parameters: params }).fetchAll();
  return NextResponse.json(resources);
}

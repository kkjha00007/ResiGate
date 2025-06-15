import { NextRequest, NextResponse } from 'next/server';
import { getApiSessionUser } from '@/lib/api-session-user';
import { getHelpDeskRequestsContainer } from '@/lib/cosmosdb';

// GET /api/billing/bills/disputes?status=open|resolved&societyId=... (admin only)
export async function GET(request: NextRequest) {
  const user = await getApiSessionUser();
  if (!user || (user.role !== 'admin' && user.role !== 'societyAdmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const status = request.nextUrl.searchParams.get('status');
  const societyId = request.nextUrl.searchParams.get('societyId');
  if (!societyId) return NextResponse.json({ error: 'societyId required' }, { status: 400 });
  const container = getHelpDeskRequestsContainer();
  let query = 'SELECT * FROM c WHERE c.societyId = @societyId AND c.type = @type';
  const params = [
    { name: '@societyId', value: societyId },
    { name: '@type', value: 'bill_dispute' },
  ];
  if (status) {
    query += ' AND c.status = @status';
    params.push({ name: '@status', value: status });
  }
  query += ' ORDER BY c.createdAt DESC';
  const { resources } = await container.items.query({ query, parameters: params }).fetchAll();
  return NextResponse.json({ disputes: resources });
}

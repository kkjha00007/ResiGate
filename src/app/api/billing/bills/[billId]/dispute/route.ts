import { NextRequest, NextResponse } from 'next/server';
import { getApiSessionUser } from '@/lib/api-session-user';
import { getHelpDeskRequestsContainer } from '@/lib/cosmosdb';
import { v4 as uuidv4 } from 'uuid';

// POST /api/billing/bills/:billId/dispute
export async function POST(request: NextRequest, { params }: { params: { billId: string } }) {
  const user = await getApiSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const billId = params.billId;
  const { description, urgent } = await request.json();
  if (!description) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }
  const helpDeskContainer = getHelpDeskRequestsContainer();
  const helpDeskRequest = {
    id: uuidv4(),
    userId: user.id,
    societyId: user.societyId,
    category: 'Accounts',
    description: `[Bill Dispute: ${billId}] ${description}`,
    urgent: !!urgent,
    status: 'open',
    billId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: 'bill_dispute',
  };
  await helpDeskContainer.items.create(helpDeskRequest);
  return NextResponse.json({ success: true, requestId: helpDeskRequest.id });
}

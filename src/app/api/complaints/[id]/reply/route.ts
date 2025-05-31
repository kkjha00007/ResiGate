// src/app/api/complaints/[id]/reply/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { complaintsContainer } from '@/lib/cosmosdb';
import type { Complaint } from '@/lib/types';

// POST: Add a reply to a complaint
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid or missing JSON body' }, { status: 400 });
  }
  const { reply, societyId } = body;
  if (!reply || !societyId) {
    return NextResponse.json({ message: 'Missing reply or societyId' }, { status: 400 });
  }
  try {
    // Fetch the complaint with correct partition key
    const { resource: complaint } = await complaintsContainer.item(id, societyId).read<Complaint>();
    if (!complaint) {
      return NextResponse.json({ message: 'Complaint not found' }, { status: 404 });
    }
    // Add reply history array if not present
    if (!Array.isArray(complaint.replies)) {
      complaint.replies = [];
    }
    complaint.replies.push({
      reply,
      repliedAt: new Date().toISOString(),
      repliedBy: request.headers.get('x-user-name') || 'Admin',
      repliedById: request.headers.get('x-user-id') || undefined,
    });
    await complaintsContainer.item(id, societyId).replace(complaint);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to add reply' }, { status: 500 });
  }
}

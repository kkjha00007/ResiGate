// src/app/api/complaints/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getComplaintsContainer } from '@/lib/cosmosdb';
import type { Complaint } from '@/lib/types';

// PATCH: Update complaint status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid or missing JSON body' }, { status: 400 });
  }
  const { status, societyId } = body;
  if (!status || !societyId) {
    return NextResponse.json({ message: 'Missing status or societyId' }, { status: 400 });
  }
  try {
    const complaintsContainer = getComplaintsContainer();
    // Fetch the complaint with correct partition key
    const { resource: complaint } = await complaintsContainer.item(id, societyId).read<Complaint>();
    if (!complaint) {
      return NextResponse.json({ message: 'Complaint not found' }, { status: 404 });
    }
    // Update status
    complaint.status = status;
    await complaintsContainer.item(id, societyId).replace(complaint);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update status' }, { status: 500 });
  }
}

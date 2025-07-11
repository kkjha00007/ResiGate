// src/app/api/complaints/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getComplaintsContainer } from '@/lib/cosmosdb';
import type { Complaint, ComplaintCategory } from '@/lib/types';
import { COMPLAINT_STATUSES_VALUES } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// Submit a new complaint
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid or missing JSON body' }, { status: 400 });
  }
  const societyId = body.societyId || request.headers.get('x-society-id') || request.nextUrl.searchParams.get('societyId');
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  let complaintsContainer;
  try {
    complaintsContainer = getComplaintsContainer();
  } catch (err) {
    return NextResponse.json({ message: 'Cosmos DB connection is not configured.' }, { status: 500 });
  }
  try {
    const { 
        userId, 
        userName, 
        userFlatNumber, 
        subject, 
        category, 
        description 
    } = body as Omit<Complaint, 'id' | 'submittedAt' | 'status' | 'societyId'>;

    if (!userId || !userName || !userFlatNumber || !subject || !category || !description) {
      return NextResponse.json({ message: 'Missing required fields for complaint submission' }, { status: 400 });
    }

    const newComplaint: Complaint = {
      id: uuidv4(),
      societyId,
      userId,
      userName,
      userFlatNumber,
      subject,
      category: category as ComplaintCategory, // Ensure type safety
      description,
      submittedAt: new Date().toISOString(),
      status: COMPLAINT_STATUSES_VALUES.OPEN,
    };

    const { resource: createdComplaint } = await complaintsContainer.items.create(newComplaint);

    if (!createdComplaint) {
      return NextResponse.json({ message: 'Failed to submit complaint' }, { status: 500 });
    }

    return NextResponse.json(createdComplaint, { status: 201 });
  } catch (error) {
    console.error('Submit Complaint API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

// Get all complaints for a society
export async function GET(request: NextRequest) {
  const societyId = request.headers.get('x-society-id') || request.nextUrl.searchParams.get('societyId');
  // If SuperAdmin, allow fetching all complaints (no societyId required)
  const userRole = request.headers.get('x-user-role');
  if (!societyId && userRole !== 'superadmin') {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  let complaintsContainer;
  try {
    complaintsContainer = getComplaintsContainer();
  } catch (err) {
    return NextResponse.json({ message: 'Cosmos DB connection is not configured.' }, { status: 500 });
  }
  try {
    let querySpec;
    if (userRole === 'superadmin') {
      // SuperAdmin: fetch all complaints
      querySpec = {
        query: 'SELECT * FROM c ORDER BY c.submittedAt DESC',
        parameters: [],
      };
    } else {
      // SocietyAdmin: fetch only for their society
      querySpec = {
        query: 'SELECT * FROM c WHERE c.societyId = @societyId ORDER BY c.submittedAt DESC',
        parameters: [{ name: '@societyId', value: societyId }],
      };
    }
    const { resources: complaints } = await complaintsContainer.items.query<Complaint>(querySpec).fetchAll();
    return NextResponse.json(complaints, { status: 200 });
  } catch (error) {
    console.error('Get Complaints API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

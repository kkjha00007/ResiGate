// src/app/api/visitors/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { visitorEntriesContainer } from '@/lib/cosmosdb';
import type { VisitorEntry } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { PUBLIC_ENTRY_SOURCE } from '@/lib/constants'; // For setting default token correctly

// Helper to extract societyId from request (header, query, or body)
async function getSocietyId(request: NextRequest): Promise<string | null> {
  const headerId = request.headers.get('x-society-id');
  if (headerId) return headerId;
  const urlId = request.nextUrl.searchParams.get('societyId');
  if (urlId) return urlId;
  try {
    const body = await request.json();
    if (body.societyId) return body.societyId;
  } catch {}
  return null;
}

// Get all visitor entries
export async function GET(request: NextRequest) {
  const societyId = request.headers.get('x-society-id') || request.nextUrl.searchParams.get('societyId');
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  try {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.societyId = @societyId',
      parameters: [{ name: '@societyId', value: societyId }],
    };
    const { resources: visitorItems } = await visitorEntriesContainer.items.query(querySpec, { partitionKey: societyId }).fetchAll();
    return NextResponse.json(visitorItems, { status: 200 });
  } catch (error: any) {
    console.error('Get Visitor Entries API error:', error);
    const errorMessage = error.body?.message || error.message || 'An unknown error occurred while fetching visitor entries.';
    return NextResponse.json({ message: `Failed to retrieve visitor entries. Detail: ${errorMessage}` }, { status: 500 });
  }
}

// Add a new visitor entry (typically by guard/admin)
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid or missing JSON body' }, { status: 400 });
  }
  // Use body for societyId extraction
  const societyId = body.societyId || request.headers.get('x-society-id') || request.nextUrl.searchParams.get('societyId');
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  try {
    // TODO: Add authentication to ensure only authorized users can add entries
    const { 
        visitorName, 
        mobileNumber, 
        flatNumber, 
        purposeOfVisit, 
        vehicleNumber,
        visitorPhotoUrl,
        notes,
        enteredBy, // Should come from authenticated user context if by guard/admin
    } = body as Omit<VisitorEntry, 'id' | 'entryTimestamp' | 'tokenCode'> & { tenantId: string };

    if (!visitorName || !mobileNumber || !flatNumber || !purposeOfVisit) {
      return NextResponse.json({ message: 'Missing required fields for visitor entry' }, { status: 400 });
    }

    const newEntry: VisitorEntry = {
      id: uuidv4(),
      societyId,
      visitorName,
      mobileNumber,
      flatNumber,
      purposeOfVisit,
      vehicleNumber,
      visitorPhotoUrl,
      notes,
      entryTimestamp: new Date().toISOString(), // Set server-side timestamp
      tokenCode: "SYSTEM", // Default token for entries made by system/guard
      enteredBy: enteredBy || "SYSTEM_USER", // Guard's ID or a system user
    };

    const { resource: createdEntry } = await visitorEntriesContainer.items.create(newEntry);

    if (!createdEntry) {
      return NextResponse.json({ message: 'Failed to add visitor entry' }, { status: 500 });
    }
    return NextResponse.json(createdEntry, { status: 201 });
  } catch (error: any) {
    console.error('Add Visitor Entry API error:', error);
    const errorMessage = error.body?.message || error.message || 'An unknown error occurred during visitor entry creation.';
    return NextResponse.json({ message: `Internal server error. Detail: ${errorMessage}` }, { status: 500 });
  }
}

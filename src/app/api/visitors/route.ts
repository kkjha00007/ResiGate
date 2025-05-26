
// src/app/api/visitors/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { visitorEntriesContainer } from '@/lib/cosmosdb';
import type { VisitorEntry } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { PUBLIC_ENTRY_SOURCE } from '@/lib/constants'; // For setting default token correctly

// Get all visitor entries
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication and authorization if needed (e.g., only admin/guard can see all)
    // TODO: Implement pagination, filtering (by date, flatNumber, tenantId etc.) for production
    // For multi-tenant: You'd need to filter by tenantId if this isn't a superadmin global view.
    // const tenantId = request.headers.get('x-tenant-id'); // Example: Get tenantId from headers
    // if (!tenantId && process.env.NODE_ENV !== 'development') { // Allow no tenant in dev for easier testing for now
    //   return NextResponse.json({ message: 'Tenant ID is required' }, { status: 400 });
    // }
    // const query = tenantId ? `SELECT * FROM c WHERE c.tenantId = "${tenantId}"` : "SELECT * FROM c";
    
    const querySpec = {
        query: "SELECT * FROM c" // For now, fetches all across tenants. Needs tenant filtering.
    };

    const { resources: visitorItems } = await visitorEntriesContainer.items.query<VisitorEntry>(querySpec).fetchAll();
    return NextResponse.json(visitorItems, { status: 200 });
  } catch (error: any) {
    console.error('Get Visitor Entries API error:', error);
    const errorMessage = error.body?.message || error.message || 'An unknown error occurred while fetching visitor entries.';
    return NextResponse.json({ message: `Failed to retrieve visitor entries. Detail: ${errorMessage}` }, { status: 500 });
  }
}

// Add a new visitor entry (typically by guard/admin)
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication to ensure only authorized users can add entries
    const body = await request.json();
    const { 
        visitorName, 
        mobileNumber, 
        flatNumber, 
        purposeOfVisit, 
        vehicleNumber,
        visitorPhotoUrl,
        notes,
        enteredBy, // Should come from authenticated user context if by guard/admin
        tenantId    // This MUST be provided, typically from user session
    } = body as Omit<VisitorEntry, 'id' | 'entryTimestamp' | 'tokenCode'> & { tenantId: string };


    if (!tenantId) {
        return NextResponse.json({ message: 'Tenant ID is required for new entries' }, { status: 400 });
    }
    if (!visitorName || !mobileNumber || !flatNumber || !purposeOfVisit) {
      return NextResponse.json({ message: 'Missing required fields for visitor entry' }, { status: 400 });
    }

    const newEntry: VisitorEntry = {
      id: uuidv4(),
      tenantId,
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
        return NextResponse.json({ message: 'Failed to create visitor entry' }, { status: 500 });
    }
    return NextResponse.json(createdEntry, { status: 201 });

  } catch (error: any) {
    console.error('Add Visitor Entry API error:', error);
    const errorMessage = error.body?.message || error.message || 'An unknown error occurred during visitor entry creation.';
    return NextResponse.json({ message: `Internal server error. Detail: ${errorMessage}` }, { status: 500 });
  }
}

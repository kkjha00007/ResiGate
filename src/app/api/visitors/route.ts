
// src/app/api/visitors/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { visitorEntriesContainer } from '@/lib/cosmosdb';
import type { VisitorEntry } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// Get all visitor entries
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication and authorization if needed (e.g., only admin/guard can see all)
    // TODO: Implement pagination, filtering (by date, flatNumber, etc.) for production
    const { resources: visitorItems } = await visitorEntriesContainer.items.readAll<VisitorEntry>().fetchAll();
    return NextResponse.json(visitorItems, { status: 200 });
  } catch (error) {
    console.error('Get Visitor Entries API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Add a new visitor entry (typically by guard/admin)
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication to ensure only authorized users can add entries
    const entryData = await request.json() as Omit<VisitorEntry, 'id' | 'entryTimestamp' | 'tokenCode'>;

    if (!entryData.visitorName || !entryData.mobileNumber || !entryData.flatNumber || !entryData.purposeOfVisit) {
      return NextResponse.json({ message: 'Missing required fields for visitor entry' }, { status: 400 });
    }

    const newEntry: VisitorEntry = {
      id: uuidv4(),
      ...entryData,
      entryTimestamp: new Date().toISOString(), // Set server-side timestamp
      tokenCode: "SYSTEM", // Default token for entries made by system/guard
      // enteredBy: from authenticated user context if needed
    };

    const { resource: createdEntry } = await visitorEntriesContainer.items.create(newEntry);
    
    if (!createdEntry) {
        return NextResponse.json({ message: 'Failed to create visitor entry' }, { status: 500 });
    }
    return NextResponse.json(createdEntry, { status: 201 });

  } catch (error) {
    console.error('Add Visitor Entry API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

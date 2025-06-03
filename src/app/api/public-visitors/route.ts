// src/app/api/public-visitors/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { visitorEntriesContainer } from '@/lib/cosmosdb';
import type { VisitorEntry } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { PUBLIC_ENTRY_SOURCE } from '@/lib/constants';

// Add a new visitor entry from the public form
export async function POST(request: NextRequest) {
  let entryData: any;
  try {
    entryData = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid or missing JSON body' }, { status: 400 });
  }
  try {
    if (!entryData.visitorName || !entryData.mobileNumber || !entryData.flatNumber || !entryData.purposeOfVisit) {
      return NextResponse.json({ message: 'Missing required fields for public visitor entry' }, { status: 400 });
    }

    const timestamp = new Date();
    const tokenCode = `RG-${timestamp.getTime().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Get IP address (Next.js API route)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const newEntry: VisitorEntry = {
      id: uuidv4(),
      ...entryData,
      entryTimestamp: timestamp.toISOString(),
      enteredBy: PUBLIC_ENTRY_SOURCE,
      tokenCode: tokenCode,
      ip,
    };

    const { resource: createdEntry } = await visitorEntriesContainer.items.create(newEntry);

    if (!createdEntry) {
        return NextResponse.json({ message: 'Failed to create public visitor entry' }, { status: 500 });
    }

    // Return only necessary info for public confirmation
    return NextResponse.json(
        { 
            visitorName: createdEntry.visitorName,
            tokenCode: createdEntry.tokenCode,
            entryTimestamp: createdEntry.entryTimestamp 
        }, 
        { status: 201 }
    );

  } catch (error) {
    console.error('Add Public Visitor Entry API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

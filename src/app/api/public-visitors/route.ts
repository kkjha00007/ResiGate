// src/app/api/public-visitors/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getVisitorEntriesContainer } from '@/lib/cosmosdb';
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
  let visitorEntriesContainer;
  try {
    visitorEntriesContainer = getVisitorEntriesContainer();
  } catch (err) {
    return NextResponse.json({ message: 'Cosmos DB connection is not configured.' }, { status: 500 });
  }
  try {
    if (!entryData.visitorName || !entryData.flatNumber || !entryData.purposeOfVisit) {
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
      status: 'pending', // Add status for approval workflow
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
            entryTimestamp: createdEntry.entryTimestamp,
            flatNumber: createdEntry.flatNumber, // Add flatNumber to response
            id: createdEntry.id, // Return id for polling
            status: createdEntry.status,
        }, 
        { status: 201 }
    );

  } catch (error) {
    console.error('Add Public Visitor Entry API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

// Add a GET endpoint to fetch a visitor entry by id for polling
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ message: 'Missing visitor entry id' }, { status: 400 });
  }
  let visitorEntriesContainer;
  try {
    visitorEntriesContainer = getVisitorEntriesContainer();
  } catch (err) {
    return NextResponse.json({ message: 'Cosmos DB connection is not configured.' }, { status: 500 });
  }
  try {
    const { resource: entry } = await visitorEntriesContainer.item(id, undefined).read();
    if (!entry) {
      return NextResponse.json({ message: 'Visitor entry not found' }, { status: 404 });
    }
    return NextResponse.json({ status: entry.status });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch visitor entry status' }, { status: 500 });
  }
}

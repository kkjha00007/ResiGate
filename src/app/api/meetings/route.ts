// src/app/api/meetings/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getMeetingsContainer } from '@/lib/cosmosdb';
import type { Meeting } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO } from 'date-fns';

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

// Create a new meeting (Super Admin only)
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
  let meetingsContainer;
  try {
    meetingsContainer = getMeetingsContainer();
  } catch (err) {
    return NextResponse.json({ message: 'Cosmos DB connection is not configured.' }, { status: 500 });
  }
  try {
    const { 
        title, 
        description,
        dateTime, // Expecting ISO string from client e.g. 2024-08-15T10:00:00.000Z
        locationOrLink,
        postedByUserId, 
        postedByName,   
    } = body as Omit<Meeting, 'id' | 'createdAt' | 'isActive' | 'monthYear' | 'updatedAt'> & { postedByUserId: string, postedByName: string };

    if (!title || !description || !dateTime || !locationOrLink || !postedByUserId || !postedByName) {
      return NextResponse.json({ message: 'Missing required fields for meeting creation' }, { status: 400 });
    }

    const now = new Date();
    const meetingDateTime = parseISO(dateTime);

    if (isNaN(meetingDateTime.getTime())) {
        return NextResponse.json({ message: 'Invalid dateTime format provided.' }, { status: 400 });
    }
    
    const newMeeting: Meeting = {
      id: uuidv4(),
      title,
      description,
      dateTime: meetingDateTime.toISOString(),
      locationOrLink,
      postedByUserId,
      postedByName,
      createdAt: now.toISOString(),
      isActive: true, 
      monthYear: format(meetingDateTime, 'yyyy-MM'), // Partition key from meeting date
      societyId,
    };

    const { resource: createdMeeting } = await meetingsContainer.items.create(newMeeting);

    if (!createdMeeting) {
      return NextResponse.json({ message: 'Failed to create meeting' }, { status: 500 });
    }

    return NextResponse.json(createdMeeting, { status: 201 });

  } catch (error) {
    console.error('Create Meeting API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

// Get all meetings for a society
export async function GET(request: NextRequest) {
  const societyId = request.headers.get('x-society-id') || request.nextUrl.searchParams.get('societyId');
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  let meetingsContainer;
  try {
    meetingsContainer = getMeetingsContainer();
  } catch (err) {
    return NextResponse.json({ message: 'Cosmos DB connection is not configured.' }, { status: 500 });
  }
  try {
    // Strict society isolation: Only fetch meetings where c.societyId matches the partition key
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.societyId = @societyId ORDER BY c.dateTime DESC',
      parameters: [{ name: '@societyId', value: societyId }],
    };
    // Enforce partitionKey in query options
    const { resources: meetings } = await meetingsContainer.items.query(querySpec, { partitionKey: societyId }).fetchAll();
    // Filter again in-memory as a failsafe (should not be needed, but double isolation)
    const strictlyIsolatedMeetings = meetings.filter((m: any) => m.societyId === societyId);
    return NextResponse.json(strictlyIsolatedMeetings, { status: 200 });
  } catch (error) {
    console.error('Get Meetings API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}


// src/app/api/meetings/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { meetingsContainer } from '@/lib/cosmosdb';
import type { Meeting } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO } from 'date-fns';

// Create a new meeting (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    // TODO: Add robust authentication and authorization (Super Admin only)
    const body = await request.json();
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

// Get all active and upcoming meetings (for all users)
export async function GET(request: NextRequest) {
  try {
    const now = new Date().toISOString();
    const querySpec = {
      query: "SELECT * FROM c WHERE c.isActive = true AND c.dateTime >= @now ORDER BY c.dateTime ASC",
      parameters: [{ name: "@now", value: now }]
    };

    const { resources: upcomingMeetings } = await meetingsContainer.items.query<Meeting>(querySpec).fetchAll();

    return NextResponse.json(upcomingMeetings, { status: 200 });

  } catch (error) {
    console.error('Get Upcoming Meetings API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

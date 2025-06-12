// src/app/api/meetings/admin/all/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getMeetingsContainer } from '@/lib/cosmosdb';
import type { Meeting } from '@/lib/types';

// Get ALL meetings (for Super Admin management table)
export async function GET(request: NextRequest) {
  let meetingsContainer;
  try {
    meetingsContainer = getMeetingsContainer();
  } catch (err) {
    return NextResponse.json({ message: 'Cosmos DB connection is not configured.' }, { status: 500 });
  }
  try {
    const querySpec = {
      query: "SELECT * FROM c ORDER BY c.dateTime DESC" // Fetches all, irrespective of isActive or past/future
    };

    const { resources: allMeetings } = await meetingsContainer.items.query<Meeting>(querySpec).fetchAll();

    // Mark expired meetings
    const now = new Date();
    const updatedMeetings = allMeetings.map((meeting) => {
      const meetingDate = new Date(meeting.dateTime);
      if (meetingDate < now) {
        return { ...meeting, status: 'expired' };
      } else {
        return { ...meeting, status: 'active' };
      }
    });

    return NextResponse.json(updatedMeetings, { status: 200 });

  } catch (error) {
    console.error('Get All Meetings (Admin) API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

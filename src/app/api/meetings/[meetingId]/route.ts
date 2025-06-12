// src/app/api/meetings/[meetingId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { safeGetMeetingsContainer } from '@/lib/cosmosdb';
import type { Meeting } from '@/lib/types';
import { format, parseISO } from 'date-fns';

// Update a meeting (e.g., toggle isActive, change details)
export async function PUT(
  request: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  try {
    // TODO: Add robust authentication and authorization (Super Admin only)
    const meetingId = params.meetingId;
    // monthYear is critical for partition key when fetching/replacing
    const { monthYear: currentMonthYear, ...updates } = await request.json() as Partial<Meeting> & { monthYear: string };

    // Get societyId from request (header, query, or body)
    let currentSocietyId = request.headers.get('x-society-id') || request.nextUrl.searchParams.get('societyId');
    if (!currentSocietyId) {
      try {
        const body = await request.json();
        currentSocietyId = body.societyId;
      } catch {}
    }
    if (!meetingId || !currentSocietyId) {
      return NextResponse.json({ message: 'Meeting ID and societyId (partition key) are required' }, { status: 400 });
    }

    const meetingsContainer = safeGetMeetingsContainer();
    if (!meetingsContainer) {
      return NextResponse.json({ message: 'Meetings container not available. Check Cosmos DB configuration.' }, { status: 500 });
    }

    // Try to find the meeting in the given society partition
    let { resource: existingMeeting } = await meetingsContainer.item(meetingId, currentSocietyId).read<Meeting>();
    let meetingToUpdate = existingMeeting as Meeting | undefined;
    let actualSocietyId = currentSocietyId;
    if (!existingMeeting) {
      // Fallback: query for meeting by id to get actual partition key (legacy data or moved partition)
      const query = {
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: meetingId }],
      };
      const { resources } = await meetingsContainer.items.query(query).fetchAll();
      const fallbackMeeting = resources[0] as Meeting | undefined;
      if (!fallbackMeeting || !fallbackMeeting.societyId) {
        return NextResponse.json({ message: 'Meeting not found or missing required fields' }, { status: 404 });
      }
      meetingToUpdate = { ...fallbackMeeting };
      actualSocietyId = fallbackMeeting.societyId;
    }
    if (!meetingToUpdate) {
      return NextResponse.json({ message: 'Meeting not found after fallback' }, { status: 404 });
    }
    let newDateTime = meetingToUpdate.dateTime;
    if (updates.dateTime) {
        const newMeetingDateTime = parseISO(updates.dateTime);
        if (isNaN(newMeetingDateTime.getTime())) {
            return NextResponse.json({ message: 'Invalid new dateTime format provided.' }, { status: 400 });
        }
        newDateTime = newMeetingDateTime.toISOString();
    }
    // No partition key change logic needed, since partition key is always societyId
    const updatedMeetingData: Meeting = {
      ...meetingToUpdate,
      ...updates,
      dateTime: newDateTime,
      updatedAt: new Date().toISOString(),
      id: meetingToUpdate.id, 
      societyId: actualSocietyId,
      postedByUserId: meetingToUpdate.postedByUserId,
      postedByName: meetingToUpdate.postedByName,
      createdAt: meetingToUpdate.createdAt,
      monthYear: meetingToUpdate.monthYear,
    };
    const { resource: replacedMeeting } = await meetingsContainer.item(meetingId, actualSocietyId).replace(updatedMeetingData);
    if (!replacedMeeting) {
        return NextResponse.json({ message: 'Failed to update meeting' }, { status: 500 });
    }
    return NextResponse.json(replacedMeeting, { status: 200 });

  } catch (error) {
    console.error(`Update Meeting ${params.meetingId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

// Delete a meeting
export async function DELETE(
  request: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  try {
    // TODO: Add robust authentication and authorization (Super Admin only)
    const meetingId = params.meetingId;
    const monthYear = request.nextUrl.searchParams.get('monthYear');

    if (!meetingId || !monthYear) {
      return NextResponse.json({ message: 'Meeting ID and monthYear (as query parameter) are required for deletion' }, { status: 400 });
    }
    
    // Get societyId from request (header, query, or body)
    let currentSocietyId = request.headers.get('x-society-id') || request.nextUrl.searchParams.get('societyId');
    if (!currentSocietyId) {
      try {
        const body = await request.json();
        currentSocietyId = body.societyId;
      } catch {}
    }
    if (!meetingId || !currentSocietyId) {
      return NextResponse.json({ message: 'Meeting ID and societyId (partition key) are required for deletion' }, { status: 400 });
    }
    const meetingsContainer = safeGetMeetingsContainer();
    if (!meetingsContainer) {
      return NextResponse.json({ message: 'Meetings container not available. Check Cosmos DB configuration.' }, { status: 500 });
    }
    let found = false;
    try {
      await meetingsContainer.item(meetingId, currentSocietyId).delete();
      found = true;
    } catch (deleteError: any) {
      if (deleteError?.code !== 404) throw deleteError;
    }
    if (!found) {
      // Fallback: query for meeting by id to get actual partition key (legacy data)
      const query = {
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: meetingId }],
      };
      const { resources } = await meetingsContainer.items.query(query).fetchAll();
      const fallbackMeeting = resources[0] as Meeting | undefined;
      if (!fallbackMeeting || !fallbackMeeting.societyId) {
        return NextResponse.json({ message: 'Meeting not found or already deleted' }, { status: 404 });
      }
      try {
        await meetingsContainer.item(meetingId, fallbackMeeting.societyId).delete();
      } catch (deleteError: any) {
        if (deleteError?.code === 404) {
          return NextResponse.json({ message: 'Meeting not found or already deleted' }, { status: 404 });
        }
        console.error(`Delete Meeting ${meetingId} API error:`, deleteError);
        const errorMessage = deleteError instanceof Error ? deleteError.message : 'An unknown error occurred';
        return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
      }
    }
    return NextResponse.json({ message: `Meeting ${meetingId} deleted successfully` }, { status: 200 });

  } catch (error) {
    console.error(`Delete Meeting ${params.meetingId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    if ((error as any)?.code === 404) { // Cosmos DB specific error code for not found
        return NextResponse.json({ message: 'Meeting not found or already deleted' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

// Get a specific meeting by ID (if needed, for instance, if edit form needs to pre-fill from a single item)
export async function GET(
  request: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  try {
    const meetingId = params.meetingId;
    const monthYear = request.nextUrl.searchParams.get('monthYear'); // Require monthYear for partition key

    if (!meetingId || !monthYear) {
      return NextResponse.json({ message: 'Meeting ID and monthYear (as query parameter) are required' }, { status: 400 });
    }

    const meetingsContainer = safeGetMeetingsContainer();
    if (!meetingsContainer) {
      return NextResponse.json({ message: 'Meetings container not available. Check Cosmos DB configuration.' }, { status: 500 });
    }

    const { resource: meeting } = await meetingsContainer.item(meetingId, monthYear).read<Meeting>();
    if (!meeting) {
      return NextResponse.json({ message: 'Meeting not found' }, { status: 404 });
    }
    return NextResponse.json(meeting, { status: 200 });
  } catch (error) {
    console.error(`Get Meeting ${params.meetingId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

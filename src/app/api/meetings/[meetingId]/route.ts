
// src/app/api/meetings/[meetingId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { meetingsContainer } from '@/lib/cosmosdb';
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

    if (!meetingId || !currentMonthYear) {
      return NextResponse.json({ message: 'Meeting ID and monthYear (for partition key) are required' }, { status: 400 });
    }

    const { resource: existingMeeting } = await meetingsContainer.item(meetingId, currentMonthYear).read<Meeting>();
    if (!existingMeeting) {
      return NextResponse.json({ message: 'Meeting not found' }, { status: 404 });
    }
    
    let newMonthYear = existingMeeting.monthYear;
    if (updates.dateTime) {
        const newMeetingDateTime = parseISO(updates.dateTime);
        if (isNaN(newMeetingDateTime.getTime())) {
            return NextResponse.json({ message: 'Invalid new dateTime format provided.' }, { status: 400 });
        }
        newMonthYear = format(newMeetingDateTime, 'yyyy-MM');
    }
    
    // If monthYear partition key changes due to dateTime update, we need to delete old item and create new.
    // Cosmos DB does not allow direct update of partition key value.
    if (newMonthYear !== existingMeeting.monthYear) {
        const newMeetingDataForCreate: Meeting = {
            ...existingMeeting,
            ...updates,
            id: existingMeeting.id, // Keep the same ID
            monthYear: newMonthYear,
            updatedAt: new Date().toISOString(),
        };
        // Delete the old item
        await meetingsContainer.item(meetingId, existingMeeting.monthYear).delete();
        // Create the new item in the new partition
        const { resource: createdMeetingInNewPartition } = await meetingsContainer.items.create(newMeetingDataForCreate);
        if (!createdMeetingInNewPartition) {
            // Attempt to roll back or log critical error
            console.error(`Critical: Failed to re-create meeting ${meetingId} in new partition ${newMonthYear} after deleting from ${existingMeeting.monthYear}`);
            return NextResponse.json({ message: 'Failed to update meeting due to partition key change complication.' }, { status: 500 });
        }
        return NextResponse.json(createdMeetingInNewPartition, { status: 200 });

    } else {
        // Standard update if partition key does not change
        const updatedMeetingData: Meeting = {
          ...existingMeeting,
          ...updates,
          updatedAt: new Date().toISOString(),
          id: existingMeeting.id, 
          monthYear: existingMeeting.monthYear,
          postedByUserId: existingMeeting.postedByUserId,
          postedByName: existingMeeting.postedByName,
          createdAt: existingMeeting.createdAt,
        };
        
        const { resource: replacedMeeting } = await meetingsContainer.item(meetingId, existingMeeting.monthYear).replace(updatedMeetingData);

        if (!replacedMeeting) {
            return NextResponse.json({ message: 'Failed to update meeting' }, { status: 500 });
        }
        return NextResponse.json(replacedMeeting, { status: 200 });
    }

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
    
    await meetingsContainer.item(meetingId, monthYear).delete();
    
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

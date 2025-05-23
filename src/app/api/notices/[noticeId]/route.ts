
// src/app/api/notices/[noticeId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { noticesContainer } from '@/lib/cosmosdb';
import type { Notice } from '@/lib/types';

// Get a specific notice by ID (might not be needed if client fetches all and filters)
// For now, focusing on PUT and DELETE

// Update a notice (e.g., toggle isActive, change title/content)
export async function PUT(
  request: NextRequest,
  { params }: { params: { noticeId: string } }
) {
  try {
    // TODO: Add robust authentication and authorization (Super Admin only)
    const noticeId = params.noticeId;
    const { monthYear, ...updates } = await request.json() as Partial<Notice> & { monthYear: string }; // monthYear must be passed by client for partition key

    if (!noticeId || !monthYear) {
      return NextResponse.json({ message: 'Notice ID and monthYear (for partition key) are required' }, { status: 400 });
    }

    const { resource: existingNotice } = await noticesContainer.item(noticeId, monthYear).read<Notice>();
    if (!existingNotice) {
      return NextResponse.json({ message: 'Notice not found' }, { status: 404 });
    }
    
    const updatedNoticeData: Notice = {
      ...existingNotice,
      ...updates,
      updatedAt: new Date().toISOString(),
      id: existingNotice.id, // Ensure ID is not changed
      monthYear: existingNotice.monthYear, // Ensure partition key is not changed
      postedByUserId: existingNotice.postedByUserId, // Ensure original poster is not changed
      postedByName: existingNotice.postedByName,
      createdAt: existingNotice.createdAt,
    };
    
    // Specific check for isActive toggle
    if (updates.hasOwnProperty('isActive') && typeof updates.isActive === 'boolean') {
        updatedNoticeData.isActive = updates.isActive;
    }


    const { resource: replacedNotice } = await noticesContainer.item(noticeId, monthYear).replace(updatedNoticeData);

    if (!replacedNotice) {
        return NextResponse.json({ message: 'Failed to update notice' }, { status: 500 });
    }

    return NextResponse.json(replacedNotice, { status: 200 });

  } catch (error) {
    console.error(`Update Notice ${params.noticeId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

// Delete a notice
export async function DELETE(
  request: NextRequest,
  { params }: { params: { noticeId: string } }
) {
  try {
    // TODO: Add robust authentication and authorization (Super Admin only)
    const noticeId = params.noticeId;
    // Client must send monthYear in query params or body for partition key
    const monthYear = request.nextUrl.searchParams.get('monthYear');


    if (!noticeId || !monthYear) {
      return NextResponse.json({ message: 'Notice ID and monthYear (as query parameter) are required for deletion' }, { status: 400 });
    }
    
    // Optional: Check if notice exists before attempting delete, though delete is idempotent
    // const { resource: existingNotice } = await noticesContainer.item(noticeId, monthYear).read<Notice>();
    // if (!existingNotice) {
    //   return NextResponse.json({ message: 'Notice not found to delete' }, { status: 404 });
    // }

    await noticesContainer.item(noticeId, monthYear).delete();
    
    return NextResponse.json({ message: `Notice ${noticeId} deleted successfully` }, { status: 200 });

  } catch (error) {
    console.error(`Delete Notice ${params.noticeId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    // If error is due to not found (e.g., status code 404 from SDK), you might want to reflect that
    if ((error as any)?.code === 404) {
        return NextResponse.json({ message: 'Notice not found or already deleted' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

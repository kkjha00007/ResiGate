// src/app/api/notices/[noticeId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { safeGetNoticesContainer } from '@/lib/cosmosdb';
import type { Notice } from '@/lib/types';

// Get a specific notice by ID (might not be needed if client fetches all and filters)
// For now, focusing on PUT and DELETE

// Update a notice (e.g., toggle isActive, change title/content)
export async function PUT(
  request: NextRequest,
  { params }: { params: { noticeId: string } }
) {
  try {
    const noticeId = params.noticeId;
    const { monthYear, ...updates } = await request.json() as Partial<Notice> & { monthYear: string };
    if (!noticeId || !monthYear) {
      return NextResponse.json({ message: 'Notice ID and monthYear (for partition key) are required' }, { status: 400 });
    }
    const noticesContainer = safeGetNoticesContainer();
    if (!noticesContainer) {
      return NextResponse.json({ message: 'Notices container not available. Check Cosmos DB configuration.' }, { status: 500 });
    }
    let { resource: existingNotice } = await noticesContainer.item(noticeId, monthYear).read<Notice>();
    let partitionKey = monthYear;
    let noticeToUpdate: Notice | undefined = existingNotice;
    if (!existingNotice) {
      // Fallback: query for notice by id to get actual partition key (legacy data)
      const query = {
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: noticeId }],
      };
      const { resources } = await noticesContainer.items.query(query).fetchAll();
      const fallbackNotice = resources[0] as Notice | undefined;
      if (!fallbackNotice) {
        return NextResponse.json({ message: 'Notice not found' }, { status: 404 });
      }
      noticeToUpdate = fallbackNotice;
      partitionKey = fallbackNotice.monthYear;
    }
    if (!noticeToUpdate || !noticeToUpdate.societyId || !noticeToUpdate.title || !noticeToUpdate.content || !noticeToUpdate.monthYear) {
      return NextResponse.json({ message: 'Notice data is incomplete or corrupt' }, { status: 500 });
    }
    const updatedNoticeData: Notice = {
      ...noticeToUpdate,
      ...updates,
      id: noticeToUpdate.id,
      societyId: noticeToUpdate.societyId,
      title: noticeToUpdate.title,
      content: noticeToUpdate.content,
      monthYear: noticeToUpdate.monthYear,
      postedByUserId: noticeToUpdate.postedByUserId,
      postedByName: noticeToUpdate.postedByName,
      createdAt: noticeToUpdate.createdAt,
      updatedAt: new Date().toISOString(),
    };
    if (updates.hasOwnProperty('isActive') && typeof updates.isActive === 'boolean') {
        updatedNoticeData.isActive = updates.isActive;
    }
    const { resource: replacedNotice } = await noticesContainer.item(noticeId, partitionKey).replace(updatedNoticeData);
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
    const noticeId = params.noticeId;
    const monthYear = request.nextUrl.searchParams.get('monthYear');
    if (!noticeId || !monthYear) {
      return NextResponse.json({ message: 'Notice ID and monthYear (as query parameter) are required for deletion' }, { status: 400 });
    }
    const noticesContainer = safeGetNoticesContainer();
    if (!noticesContainer) {
      return NextResponse.json({ message: 'Notices container not available. Check Cosmos DB configuration.' }, { status: 500 });
    }
    let found = false;
    try {
      await noticesContainer.item(noticeId, monthYear).delete();
      found = true;
    } catch (deleteError: any) {
      if (deleteError?.code !== 404) throw deleteError;
    }
    if (!found) {
      // Fallback: query for notice by id to get actual partition key (legacy data)
      const query = {
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: noticeId }],
      };
      const { resources } = await noticesContainer.items.query(query).fetchAll();
      const fallbackNotice = resources[0] as Notice | undefined;
      if (!fallbackNotice) {
        return NextResponse.json({ message: 'Notice not found or already deleted' }, { status: 404 });
      }
      try {
        await noticesContainer.item(noticeId, fallbackNotice.monthYear).delete();
      } catch (deleteError: any) {
        if (deleteError?.code === 404) {
          return NextResponse.json({ message: 'Notice not found or already deleted' }, { status: 404 });
        }
        console.error(`Delete Notice ${noticeId} API error:`, deleteError);
        const errorMessage = deleteError instanceof Error ? deleteError.message : 'An unknown error occurred';
        return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
      }
    }
    return NextResponse.json({ message: `Notice ${noticeId} deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error(`Delete Notice ${params.noticeId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    if ((error as any)?.code === 404) {
        return NextResponse.json({ message: 'Notice not found or already deleted' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

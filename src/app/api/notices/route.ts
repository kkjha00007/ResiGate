// src/app/api/notices/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { noticesContainer } from '@/lib/cosmosdb';
import type { Notice } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { logAuditAction } from '@/lib/utils';

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

// Create a new notice (Super Admin only)
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid or missing JSON body' }, { status: 400 });
  }
  // Use body for societyId extraction
  const societyId = body.societyId || request.headers.get('x-society-id') || request.nextUrl.searchParams.get('societyId');
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }

  try {
    const { 
        title, 
        content,
        postedByUserId, // Should come from authenticated user session
        postedByName,   // Should come from authenticated user session
    } = body as Omit<Notice, 'id' | 'createdAt' | 'isActive' | 'monthYear' | 'updatedAt'> & { postedByUserId: string, postedByName: string};

    if (!title || !content || !postedByUserId || !postedByName) {
      return NextResponse.json({ message: 'Missing required fields for notice creation' }, { status: 400 });
    }

    const now = new Date();
    const currentMonthYear = format(now, 'yyyy-MM');
    const newNotice: Notice = {
      id: uuidv4(),
      ...body,
      societyId,
      postedByUserId,
      postedByName,
      createdAt: now.toISOString(),
      isActive: true,
      monthYear: currentMonthYear,
    };

    const { resource: createdNotice } = await noticesContainer.items.create(newNotice);

    if (!createdNotice) {
      return NextResponse.json({ message: 'Failed to create notice' }, { status: 500 });
    }

    // --- Audit Log ---
    await logAuditAction({
      societyId,
      userId: postedByUserId,
      userName: postedByName,
      userRole: 'superadmin', // Adjust as needed
      action: 'CREATE_NOTICE',
      targetType: 'Notice',
      targetId: createdNotice.id,
      details: { title: createdNotice.title },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
      userAgent: request.headers.get('user-agent') || '',
    });
    // --- End Audit Log ---

    return NextResponse.json(createdNotice, { status: 201 });

  } catch (error) {
    console.error('Create Notice API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}


// Get all active notices (for all users)
export async function GET(request: NextRequest) {
  const societyId = request.headers.get('x-society-id') || request.nextUrl.searchParams.get('societyId');
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  try {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.isActive = true AND c.societyId = @societyId ORDER BY c.createdAt DESC',
      parameters: [{ name: '@societyId', value: societyId }],
    };
    const { resources: activeNotices } = await noticesContainer.items.query(querySpec, { partitionKey: societyId }).fetchAll();
    return NextResponse.json(activeNotices, { status: 200 });
  } catch (error) {
    console.error('Get Active Notices API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

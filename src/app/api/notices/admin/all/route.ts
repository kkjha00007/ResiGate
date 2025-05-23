
// src/app/api/notices/admin/all/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { noticesContainer } from '@/lib/cosmosdb';
import type { Notice } from '@/lib/types';

// Get ALL notices (for Super Admin management table)
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication and authorization to ensure only Super Admin can access
    const querySpec = {
      query: "SELECT * FROM c ORDER BY c.createdAt DESC" // Fetches all, irrespective of isActive
    };

    const { resources: allNotices } = await noticesContainer.items.query<Notice>(querySpec).fetchAll();

    return NextResponse.json(allNotices, { status: 200 });

  } catch (error) {
    console.error('Get All Notices (Admin) API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

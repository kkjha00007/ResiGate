// src/app/api/notices/admin/all/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getNoticesContainer } from '@/lib/cosmosdb';
import type { Notice } from '@/lib/types';

// Get ALL notices (for Super Admin management table)
export async function GET(request: NextRequest) {
  const societyId = request.headers.get('x-society-id') || request.nextUrl.searchParams.get('societyId');
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  let noticesContainer;
  try {
    noticesContainer = getNoticesContainer();
  } catch (err) {
    return NextResponse.json({ message: 'Cosmos DB connection is not configured.' }, { status: 500 });
  }
  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.societyId = @societyId ORDER BY c.createdAt DESC",
      parameters: [{ name: "@societyId", value: societyId }]
    };
    const { resources: allNotices } = await noticesContainer.items.query(querySpec, { partitionKey: societyId }).fetchAll();
    return NextResponse.json(allNotices, { status: 200 });
  } catch (error) {
    console.error('Get All Notices (Admin) API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

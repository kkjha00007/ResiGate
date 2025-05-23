
// src/app/api/complaints/user/[userId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { complaintsContainer } from '@/lib/cosmosdb';
import type { Complaint } from '@/lib/types';

// Get complaints for a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const querySpec = {
      query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.submittedAt DESC",
      parameters: [{ name: "@userId", value: userId }]
    };

    const { resources: userComplaints } = await complaintsContainer.items.query<Complaint>(querySpec).fetchAll();

    return NextResponse.json(userComplaints, { status: 200 });

  } catch (error) {
    console.error(`Get Complaints for User ${params.userId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

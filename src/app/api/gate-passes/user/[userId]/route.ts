
// src/app/api/gate-passes/user/[userId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { gatePassesContainer } from '@/lib/cosmosdb';
import type { GatePass } from '@/lib/types';

// Get gate passes for a specific user
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
      query: "SELECT * FROM c WHERE c.residentUserId = @userId ORDER BY c.createdAt DESC",
      parameters: [{ name: "@userId", value: userId }]
    };

    const { resources: gatePasses } = await gatePassesContainer.items.query<GatePass>(querySpec).fetchAll();

    return NextResponse.json(gatePasses, { status: 200 });

  } catch (error) {
    console.error(`Get Gate Passes for User ${params.userId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

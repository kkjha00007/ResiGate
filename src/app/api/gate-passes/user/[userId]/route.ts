// src/app/api/gate-passes/user/[userId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getGatePassesContainer } from '@/lib/cosmosdb';
import type { GatePass } from '@/lib/types';
import { GATE_PASS_STATUSES } from '@/lib/types';

// Get gate passes for a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  let gatePassesContainer;
  try {
    gatePassesContainer = getGatePassesContainer();
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Cosmos DB connection is not configured.', err);
    }
    return NextResponse.json({ message: 'Cosmos DB connection is not configured.' }, { status: 500 });
  }
  try {
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const querySpec = {
      query: "SELECT * FROM c WHERE c.residentUserId = @userId ORDER BY c.createdAt DESC",
      parameters: [{ name: "@userId", value: userId }]
    };

    const { resources: gatePasses } = await gatePassesContainer.items.query<GatePass>(querySpec).fetchAll();

    // Mark expired passes (in-memory for response)
    const now = new Date();
    const updatedGatePasses = gatePasses.map(pass => {
      if (
        pass.status === GATE_PASS_STATUSES.PENDING &&
        new Date(pass.expectedVisitDate) < now
      ) {
        return { ...pass, status: GATE_PASS_STATUSES.EXPIRED };
      }
      return pass;
    });

    return NextResponse.json(updatedGatePasses, { status: 200 });

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      const { userId } = await params;
      console.error(`Get Gate Passes for User ${userId} API error:`, error);
    }
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

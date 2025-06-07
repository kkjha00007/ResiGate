// src/app/api/gate-passes/by-token/[tokenCode]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getGatePassesContainer } from '@/lib/cosmosdb';
import type { GatePass } from '@/lib/types';

// Get a specific gate pass by Token Code
export async function GET(
  request: NextRequest,
  { params }: { params: { tokenCode: string } }
) {
  try {
    const tokenCode = params.tokenCode?.toUpperCase(); // Ensure token is compared in consistent case
    if (!tokenCode) {
      return NextResponse.json({ message: 'Token Code is required' }, { status: 400 });
    }
    const gatePassesContainer = getGatePassesContainer();
    const querySpec = {
      query: "SELECT * FROM c WHERE c.tokenCode = @tokenCode",
      parameters: [{ name: "@tokenCode", value: tokenCode }]
    };
    const { resources } = await gatePassesContainer.items.query<GatePass>(querySpec).fetchAll();

    if (resources.length === 0) {
      return NextResponse.json({ message: 'Gate pass not found for this token' }, { status: 404 });
    }
    // Assuming tokenCode is unique, return the first match
    return NextResponse.json(resources[0], { status: 200 });
  } catch (error) {
    console.error(`Get Gate Pass by Token ${params.tokenCode} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

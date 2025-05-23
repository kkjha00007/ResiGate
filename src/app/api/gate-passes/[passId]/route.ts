
// src/app/api/gate-passes/[passId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { gatePassesContainer } from '@/lib/cosmosdb';
import type { GatePass } from '@/lib/types';
import { GATE_PASS_STATUSES } from '@/lib/types';

// Get a specific gate pass by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { passId: string } }
) {
  try {
    const passId = params.passId;
    if (!passId) {
      return NextResponse.json({ message: 'Pass ID is required' }, { status: 400 });
    }

    // Assuming residentUserId is the partition key, but we are fetching by id directly.
    // For direct read, partition key is needed: const { resource } = await gatePassesContainer.item(passId, PARTITION_KEY_VALUE).read();
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @passId",
      parameters: [{ name: "@passId", value: passId }]
    };
    const { resources } = await gatePassesContainer.items.query<GatePass>(querySpec).fetchAll();

    if (resources.length === 0) {
      return NextResponse.json({ message: 'Gate pass not found' }, { status: 404 });
    }
    return NextResponse.json(resources[0], { status: 200 });
  } catch (error) {
    console.error(`Get Gate Pass ${params.passId} API error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


// Cancel a gate pass (update its status)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { passId: string } }
) {
  try {
    const passId = params.passId;
    if (!passId) {
      return NextResponse.json({ message: 'Pass ID is required' }, { status: 400 });
    }

    // Fetch the pass to get its partition key (residentUserId)
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @passId",
      parameters: [{ name: "@passId", value: passId }]
    };
    const { resources } = await gatePassesContainer.items.query<GatePass>(querySpec).fetchAll();

    if (resources.length === 0) {
      return NextResponse.json({ message: 'Gate pass not found' }, { status: 404 });
    }
    const gatePassToUpdate = resources[0];

    // Check if already cancelled or used
    if (gatePassToUpdate.status === GATE_PASS_STATUSES.CANCELLED || gatePassToUpdate.status === GATE_PASS_STATUSES.USED) {
        return NextResponse.json({ message: `Gate pass is already ${gatePassToUpdate.status.toLowerCase()}.` }, { status: 400 });
    }

    const updatedPassData: GatePass = {
      ...gatePassToUpdate,
      status: GATE_PASS_STATUSES.CANCELLED,
      updatedAt: new Date().toISOString(),
    };

    const { resource: updatedPass } = await gatePassesContainer.item(passId, gatePassToUpdate.residentUserId).replace(updatedPassData);
    
    if (!updatedPass) {
        return NextResponse.json({ message: 'Failed to cancel gate pass' }, { status: 500 });
    }

    return NextResponse.json(updatedPass, { status: 200 });

  } catch (error) {
    console.error(`Cancel Gate Pass ${params.passId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}


// Update a gate pass (Placeholder for future use, e.g., editing details)
export async function PUT(
  request: NextRequest,
  { params }: { params: { passId: string } }
) {
  try {
    const passId = params.passId;
    const updates = await request.json() as Partial<GatePass>;

    if (!passId) {
      return NextResponse.json({ message: 'Pass ID is required' }, { status: 400 });
    }
    
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @passId",
      parameters: [{ name: "@passId", value: passId }]
    };
    const { resources } = await gatePassesContainer.items.query<GatePass>(querySpec).fetchAll();

    if (resources.length === 0) {
      return NextResponse.json({ message: 'Gate pass not found' }, { status: 404 });
    }
    const gatePassToUpdate = resources[0];

    // Prevent changing critical fields like id, residentUserId, tokenCode via this generic update
    const updatedPassData: GatePass = {
      ...gatePassToUpdate,
      ...updates,
      id: gatePassToUpdate.id, 
      residentUserId: gatePassToUpdate.residentUserId,
      tokenCode: gatePassToUpdate.tokenCode,
      status: updates.status || gatePassToUpdate.status, // Allow status updates for guard actions later
      updatedAt: new Date().toISOString(),
    };
    
    // Ensure password is not part of updates if User type was accidentally used for GatePass updates
    delete (updatedPassData as any).password;


    const { resource: replacedPass } = await gatePassesContainer.item(passId, gatePassToUpdate.residentUserId).replace(updatedPassData);

    if (!replacedPass) {
        return NextResponse.json({ message: 'Failed to update gate pass' }, { status: 500 });
    }
    return NextResponse.json(replacedPass, { status: 200 });

  } catch (error) {
    console.error(`Update Gate Pass ${params.passId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

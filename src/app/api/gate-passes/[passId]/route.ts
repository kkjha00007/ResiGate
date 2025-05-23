
// src/app/api/gate-passes/[passId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { gatePassesContainer, visitorEntriesContainer } from '@/lib/cosmosdb';
import type { GatePass, VisitorEntry } from '@/lib/types';
import { GATE_PASS_STATUSES } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

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

    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @passId",
      parameters: [{ name: "@passId", value: passId }]
    };
    const { resources } = await gatePassesContainer.items.query<GatePass>(querySpec).fetchAll();

    if (resources.length === 0) {
      return NextResponse.json({ message: 'Gate pass not found' }, { status: 404 });
    }
    const gatePassToUpdate = resources[0];

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

  } catch (error)
{
    console.error(`Cancel Gate Pass ${params.passId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}


// Update a gate pass (e.g., mark as used by Guard)
export async function PUT(
  request: NextRequest,
  { params }: { params: { passId: string } }
) {
  try {
    const passId = params.passId;
    const { status: newStatus, markedUsedBy: guardId } = await request.json(); // `markedUsedBy` is the guard's user ID

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

    if (gatePassToUpdate.status !== GATE_PASS_STATUSES.PENDING) {
        return NextResponse.json({ message: `Gate pass is not pending. Current status: ${gatePassToUpdate.status}` }, { status: 400 });
    }
    if (newStatus !== GATE_PASS_STATUSES.USED) {
        return NextResponse.json({ message: `Invalid status update. Only 'Used' is allowed through this action.` }, { status: 400 });
    }

    const updatedPassData: GatePass = {
      ...gatePassToUpdate,
      status: GATE_PASS_STATUSES.USED,
      updatedAt: new Date().toISOString(),
    };
    
    const { resource: replacedPass } = await gatePassesContainer.item(passId, gatePassToUpdate.residentUserId).replace(updatedPassData);

    if (!replacedPass) {
        return NextResponse.json({ message: 'Failed to update gate pass status' }, { status: 500 });
    }

    // Create a corresponding VisitorEntry
    const visitorEntry: VisitorEntry = {
        id: uuidv4(),
        visitorName: replacedPass.visitorName,
        mobileNumber: 'N/A', // Gate pass might not have mobile, or add if available
        flatNumber: replacedPass.residentFlatNumber,
        purposeOfVisit: replacedPass.purposeOfVisit,
        entryTimestamp: new Date().toISOString(),
        vehicleNumber: replacedPass.vehicleNumber,
        enteredBy: guardId || "GUARD_SYSTEM", // Guard's ID who marked it used
        notes: `Entry via Gate Pass. Original notes: ${replacedPass.notes || 'N/A'}`,
        tokenCode: replacedPass.tokenCode, // Use the gate pass token code
        gatePassId: replacedPass.id,
    };

    const { resource: createdEntry } = await visitorEntriesContainer.items.create(visitorEntry);
    if (!createdEntry) {
        // Log this error, but the pass update was successful, so don't fail the whole request
        console.error(`Failed to create visitor entry for gate pass ${replacedPass.id}, but pass was marked as used.`);
        // Potentially, you could try to roll back the pass status update here, or queue a retry for visitor entry.
        // For now, we prioritize marking the pass as used.
    }

    return NextResponse.json({ updatedPass: replacedPass, visitorEntry: createdEntry }, { status: 200 });

  } catch (error) {
    console.error(`Update Gate Pass (Mark Used) ${params.passId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

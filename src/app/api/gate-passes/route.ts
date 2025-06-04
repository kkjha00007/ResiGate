// src/app/api/gate-passes/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getGatePassesContainer } from '@/lib/cosmosdb';
import type { GatePass } from '@/lib/types';
import { GATE_PASS_STATUSES } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// Create a new gate pass
export async function POST(request: NextRequest) {
  let gatePassesContainer;
  try {
    gatePassesContainer = getGatePassesContainer();
  } catch (err) {
    return NextResponse.json({ message: 'Cosmos DB connection is not configured.' }, { status: 500 });
  }
  try {
    const passData = await request.json() as Omit<GatePass, 'id' | 'tokenCode' | 'status' | 'createdAt'>;

    if (!passData.residentUserId || !passData.residentFlatNumber || !passData.visitorName || !passData.expectedVisitDate || !passData.visitDetailsOrTime || !passData.purposeOfVisit) {
      return NextResponse.json({ message: 'Missing required fields for gate pass' }, { status: 400 });
    }

    const timestamp = new Date();
    const tokenCode = `GP-${timestamp.getTime().toString().slice(-5)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newGatePass: GatePass = {
      id: uuidv4(),
      ...passData,
      tokenCode,
      status: GATE_PASS_STATUSES.PENDING,
      createdAt: timestamp.toISOString(),
      updatedAt: timestamp.toISOString(),
    };

    const { resource: createdGatePass } = await gatePassesContainer.items.create(newGatePass);

    if (!createdGatePass) {
      return NextResponse.json({ message: 'Failed to create gate pass' }, { status: 500 });
    }

    return NextResponse.json(createdGatePass, { status: 201 });

  } catch (error) {
    console.error('Create Gate Pass API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

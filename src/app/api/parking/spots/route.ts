// src/app/api/parking/spots/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getParkingSpotsContainer } from '@/lib/cosmosdb';
import type { ParkingSpot, ParkingSpotType } from '@/lib/types';
import { PARKING_SPOT_STATUSES } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';

// TODO: Implement proper admin authentication check for all mutating methods (POST, PUT, DELETE)

// Create a new parking spot (Admin only)
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid or missing JSON body' }, { status: 400 });
  }
  const societyId = body.societyId || request.headers.get('x-society-id') || request.nextUrl.searchParams.get('societyId');
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  let parkingSpotsContainer;
  try {
    parkingSpotsContainer = getParkingSpotsContainer();
  } catch (err) {
    return NextResponse.json({ message: 'Cosmos DB connection is not configured.' }, { status: 500 });
  }
  try {
    const { spotNumber, type, location, notes } = body;

    if (!spotNumber || !type || !location) {
      return NextResponse.json({ message: 'Missing required fields: spotNumber, type, location' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newSpot: ParkingSpot = {
      id: uuidv4(),
      societyId,
      spotNumber,
      type: type as ParkingSpotType,
      location,
      status: PARKING_SPOT_STATUSES[0], // Default to 'available'
      notes,
      createdAt: now,
      updatedAt: now,
    };

    const { resource: createdSpot } = await parkingSpotsContainer.items.create(newSpot);
    if (!createdSpot) {
      return NextResponse.json({ message: 'Failed to create parking spot' }, { status: 500 });
    }
    return NextResponse.json(createdSpot, { status: 201 });
  } catch (error) {
    console.error('Create Parking Spot API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

// Get all parking spots (Admin only)
export async function GET(request: NextRequest) {
  const societyId = request.headers.get('x-society-id') || request.nextUrl.searchParams.get('societyId');
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  let parkingSpotsContainer;
  try {
    parkingSpotsContainer = getParkingSpotsContainer();
  } catch (err) {
    return NextResponse.json({ message: 'Cosmos DB connection is not configured.' }, { status: 500 });
  }
  try {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.societyId = @societyId',
      parameters: [{ name: '@societyId', value: societyId }],
    };
    const { resources } = await parkingSpotsContainer.items.query(querySpec, { partitionKey: societyId }).fetchAll();
    return NextResponse.json(resources, { status: 200 });
  } catch (error) {
    console.error('Get All Parking Spots API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}



// src/app/api/parking/spots/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { parkingSpotsContainer } from '@/lib/cosmosdb';
import type { ParkingSpot, ParkingSpotStatus, ParkingSpotType } from '@/lib/types';
import { PARKING_SPOT_STATUSES } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';

// TODO: Implement proper admin authentication check for all mutating methods (POST, PUT, DELETE)

// Create a new parking spot (Admin only)
export async function POST(request: NextRequest) {
  // const isAdmin = true; // Replace with actual auth check
  // if (!isAdmin) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

  try {
    const body = await request.json() as Omit<ParkingSpot, 'id' | 'createdAt' | 'updatedAt' | 'status'>;
    const { spotNumber, type, location, notes } = body;

    if (!spotNumber || !type || !location) {
      return NextResponse.json({ message: 'Missing required fields: spotNumber, type, location' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newSpot: ParkingSpot = {
      id: uuidv4(),
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
  // const isAdmin = true; // Replace with actual auth check
  // if (!isAdmin) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

  try {
    const querySpec = {
      query: "SELECT * FROM c" // Removed ORDER BY c.location ASC, c.spotNumber ASC
    };
    const { resources } = await parkingSpotsContainer.items.query<ParkingSpot>(querySpec).fetchAll();
    return NextResponse.json(resources, { status: 200 });
  } catch (error) {
    console.error('Get All Parking Spots API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


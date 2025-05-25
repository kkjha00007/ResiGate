
// src/app/api/parking/spots/[spotId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { parkingSpotsContainer } from '@/lib/cosmosdb';
import type { ParkingSpot, ParkingSpotStatus, ParkingSpotType } from '@/lib/types';
import { PARKING_SPOT_STATUSES } from '@/lib/constants';

// TODO: Implement proper admin authentication check for all methods

// Get a specific parking spot by ID (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { spotId: string } }
) {
  // const isAdmin = true; // Replace with actual auth check
  // if (!isAdmin) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

  try {
    const spotId = params.spotId;
    if (!spotId) {
      return NextResponse.json({ message: 'Parking Spot ID is required' }, { status: 400 });
    }

    const { resource } = await parkingSpotsContainer.item(spotId, spotId).read<ParkingSpot>();
    if (!resource) {
      return NextResponse.json({ message: 'Parking spot not found' }, { status: 404 });
    }
    return NextResponse.json(resource, { status: 200 });
  } catch (error) {
    console.error(`Get Parking Spot ${params.spotId} API error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Update a parking spot (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { spotId: string } }
) {
  // const isAdmin = true; // Replace with actual auth check
  // if (!isAdmin) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

  try {
    const spotId = params.spotId;
    const updates = await request.json() as Partial<Omit<ParkingSpot, 'id' | 'createdAt'>>;

    if (!spotId) {
      return NextResponse.json({ message: 'Parking Spot ID is required' }, { status: 400 });
    }

    const { resource: existingSpot } = await parkingSpotsContainer.item(spotId, spotId).read<ParkingSpot>();
    if (!existingSpot) {
      return NextResponse.json({ message: 'Parking spot not found' }, { status: 404 });
    }

    // If unassigning, clear allocation fields
    if (updates.status === PARKING_SPOT_STATUSES[0] /* available */) {
        updates.allocatedToFlatNumber = undefined;
        updates.allocatedToUserId = undefined;
        updates.vehicleNumber = undefined;
    } else if (updates.status === PARKING_SPOT_STATUSES[1] /* allocated */) {
        if (!updates.allocatedToFlatNumber) { // Basic validation
            return NextResponse.json({ message: 'allocatedToFlatNumber is required when status is allocated' }, { status: 400 });
        }
    }


    const updatedSpotData: ParkingSpot = {
      ...existingSpot,
      ...updates,
      id: existingSpot.id, // Ensure ID is not changed
      updatedAt: new Date().toISOString(),
    };
    
    const { resource: replacedSpot } = await parkingSpotsContainer.item(spotId, spotId).replace(updatedSpotData);

    if (!replacedSpot) {
        return NextResponse.json({ message: 'Failed to update parking spot' }, { status: 500 });
    }
    return NextResponse.json(replacedSpot, { status: 200 });
  } catch (error) {
    console.error(`Update Parking Spot ${params.spotId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

// Delete a parking spot (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { spotId: string } }
) {
  // const isAdmin = true; // Replace with actual auth check
  // if (!isAdmin) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

  try {
    const spotId = params.spotId;
    if (!spotId) {
      return NextResponse.json({ message: 'Parking Spot ID is required' }, { status: 400 });
    }
    
    await parkingSpotsContainer.item(spotId, spotId).delete();
    
    return NextResponse.json({ message: `Parking spot ${spotId} deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error(`Delete Parking Spot ${params.spotId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    if ((error as any)?.code === 404) {
        return NextResponse.json({ message: 'Parking spot not found or already deleted' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

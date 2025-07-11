// src/app/api/facilities/[facilityId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { safeGetFacilitiesContainer } from '@/lib/cosmosdb';
import type { Facility } from '@/lib/types';

// Helper to check if user is superadmin (replace with your actual auth check)
const isSuperAdmin = (request: NextRequest): boolean => {
  return true; // !!IMPORTANT!!: Replace with actual robust admin check
};

// Get a specific facility by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { facilityId: string } }
) {
  try {
    const facilityId = params.facilityId;
    const { searchParams } = new URL(request.url);
    const societyId = searchParams.get('societyId');
    if (!facilityId || !societyId) {
      return NextResponse.json({ message: 'Facility ID and societyId are required' }, { status: 400 });
    }

    const facilitiesContainer = safeGetFacilitiesContainer();
    if (!facilitiesContainer) {
      return NextResponse.json({ message: 'Facilities container not available. Check Cosmos DB configuration.' }, { status: 500 });
    }

    const { resource } = await facilitiesContainer.item(facilityId, societyId).read<Facility>();
    if (!resource) {
      return NextResponse.json({ message: 'Facility not found' }, { status: 404 });
    }
    return NextResponse.json(resource, { status: 200 });
  } catch (error) {
    console.error(`Get Facility ${params.facilityId} API error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Update a facility (Super Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { facilityId: string } }
) {
//   if (!isSuperAdmin(request)) {
//     return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
//   }

  try {
    const facilityId = params.facilityId;
    const { searchParams } = new URL(request.url);
    const societyId = searchParams.get('societyId');
    if (!facilityId || !societyId) {
      return NextResponse.json({ message: 'Facility ID and societyId are required' }, { status: 400 });
    }
    const updates = await request.json() as Partial<Omit<Facility, 'id' | 'createdAt' | 'updatedAt'>>;

    const facilitiesContainer = safeGetFacilitiesContainer();
    if (!facilitiesContainer) {
      return NextResponse.json({ message: 'Facilities container not available. Check Cosmos DB configuration.' }, { status: 500 });
    }

    const { resource: existingFacility } = await facilitiesContainer.item(facilityId, societyId).read<Facility>();
    if (!existingFacility) {
      return NextResponse.json({ message: 'Facility not found' }, { status: 404 });
    }

    const updatedFacilityData: Facility = {
      ...existingFacility,
      ...updates,
      id: existingFacility.id, // Ensure ID is not changed
      updatedAt: new Date().toISOString(),
    };
    
    const { resource: replacedFacility } = await facilitiesContainer.item(facilityId, societyId).replace(updatedFacilityData);

    if (!replacedFacility) {
        return NextResponse.json({ message: 'Failed to update facility' }, { status: 500 });
    }
    return NextResponse.json(replacedFacility, { status: 200 });
  } catch (error) {
    console.error(`Update Facility ${params.facilityId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

// Delete a facility (Super Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { facilityId: string } }
) {
//   if (!isSuperAdmin(request)) {
//     return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
//   }

  try {
    const facilityId = params.facilityId;
    const { searchParams } = new URL(request.url);
    const societyId = searchParams.get('societyId');
    if (!facilityId || !societyId) {
      return NextResponse.json({ message: 'Facility ID and societyId are required' }, { status: 400 });
    }
    
    const facilitiesContainer = safeGetFacilitiesContainer();
    if (!facilitiesContainer) {
      return NextResponse.json({ message: 'Facilities container not available. Check Cosmos DB configuration.' }, { status: 500 });
    }

    await facilitiesContainer.item(facilityId, societyId).delete();
    
    return NextResponse.json({ message: `Facility ${facilityId} deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error(`Delete Facility ${params.facilityId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    if ((error as any)?.code === 404) {
        return NextResponse.json({ message: 'Facility not found or already deleted' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

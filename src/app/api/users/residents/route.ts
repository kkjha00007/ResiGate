
// src/app/api/users/residents/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { usersContainer } from '@/lib/cosmosdb';
import type { User, NeighbourProfile } from '@/lib/types';
import { USER_ROLES } from '@/lib/constants';

// Get all approved residents (owners and renters)
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication to ensure only logged-in users can access this
    // For now, assuming client-side routing restricts access appropriately.

    const querySpec = {
      query: "SELECT c.id, c.name, c.flatNumber FROM c WHERE (c.role = @ownerRole OR c.role = @renterRole) AND c.isApproved = true ORDER BY c.flatNumber ASC, c.name ASC",
      parameters: [
        { name: "@ownerRole", value: USER_ROLES.OWNER },
        { name: "@renterRole", value: USER_ROLES.RENTER }
      ]
    };

    const { resources: residentProfiles } = await usersContainer.items.query<NeighbourProfile>(querySpec).fetchAll();
    
    return NextResponse.json(residentProfiles, { status: 200 });

  } catch (error) {
    console.error('Get Approved Residents API error:', error); // This log is crucial
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: `Failed to retrieve approved residents. Detail: ${errorMessage}` }, { status: 500 });
  }
}

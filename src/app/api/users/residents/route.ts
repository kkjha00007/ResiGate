// src/app/api/users/residents/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getUsersContainer } from '@/lib/cosmosdb';
import type { User, NeighbourProfile } from '@/lib/types';
import { USER_ROLES } from '@/lib/constants';

// Get all approved residents (owners and renters)
export async function GET(request: NextRequest) {
  try {
    const usersContainer = await getUsersContainer();
    const societyId = request.nextUrl.searchParams.get('societyId');
    if (!societyId) {
      return NextResponse.json({ message: 'Society ID is required.' }, { status: 400 });
    }
    const querySpec = {
      query: "SELECT c.id, c.name, c.flatNumber FROM c WHERE (c.role = @ownerRole OR c.role = @renterRole) AND c.isApproved = true AND c.societyId = @societyId",
      parameters: [
        { name: "@ownerRole", value: USER_ROLES.OWNER },
        { name: "@renterRole", value: USER_ROLES.RENTER },
        { name: "@societyId", value: societyId }
      ]
    };
    const { resources: residentProfiles } = await usersContainer.items.query<NeighbourProfile>(querySpec, { partitionKey: societyId }).fetchAll();
    return NextResponse.json(residentProfiles, { status: 200 });
  } catch (error: any) {
    console.error('Get Approved Residents API error:', error); 
    const errorMessage = error?.body?.message || error?.message || 'An unknown error occurred while fetching approved residents.';
    return NextResponse.json({ message: `Failed to retrieve approved residents. Detail: ${errorMessage}` }, { status: 500 });
  }
}


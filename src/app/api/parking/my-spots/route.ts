// src/app/api/parking/my-spots/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getParkingSpotsContainer } from '@/lib/cosmosdb';
import type { ParkingSpot } from '@/lib/types';
// Note: In a real app, you'd get the userId from an authenticated session (e.g., JWT, NextAuth session)
// For now, we'll expect it as a query parameter for simplicity, or you can adapt this.

export async function GET(request: NextRequest) {
  // This is a placeholder for getting the authenticated user's ID.
  // In a real app, you'd use your authentication mechanism (e.g., headers, cookies, server session).
  // For this example, we'll try to get it from a query parameter, but this is NOT secure for production.
  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId) {
    // In a real app, if no user is authenticated, return 401 or 403
    return NextResponse.json({ message: 'User ID is required as a query parameter for this demo. Ensure user is authenticated.' }, { status: 400 });
  }
  let parkingSpotsContainer;
  try {
    parkingSpotsContainer = getParkingSpotsContainer();
  } catch (err) {
    return NextResponse.json({ message: 'Cosmos DB connection is not configured.' }, { status: 500 });
  }
  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.allocatedToUserId = @userId AND c.status = 'allocated'",
      parameters: [{ name: "@userId", value: userId }]
    };

    const { resources: mySpots } = await parkingSpotsContainer.items.query<ParkingSpot>(querySpec).fetchAll();

    return NextResponse.json(mySpots, { status: 200 });

  } catch (error) {
    console.error(`Get My Parking Spots for User ${userId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

// src/app/api/facilities/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { facilitiesContainer } from '@/lib/cosmosdb';
import type { Facility } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// Helper to check if user is superadmin (replace with your actual auth check)
const isSuperAdmin = (request: NextRequest): boolean => {
  // This is a placeholder. In a real app, you would get the authenticated user's
  // session and check their role.
  return true; // !!IMPORTANT!!: Replace with actual robust admin check
};

// Helper to extract societyId from request (header, query, or body)
async function getSocietyId(request: NextRequest): Promise<string | null> {
  const headerId = request.headers.get('x-society-id');
  if (headerId) return headerId;
  const urlId = request.nextUrl.searchParams.get('societyId');
  if (urlId) return urlId;
  try {
    const body = await request.json();
    if (body.societyId) return body.societyId;
  } catch {}
  return null;
}

// Get all facilities
export async function GET(request: NextRequest) {
  const societyId = request.headers.get('x-society-id') || request.nextUrl.searchParams.get('societyId');
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  try {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.societyId = @societyId ORDER BY c.name ASC',
      parameters: [{ name: '@societyId', value: societyId }],
    };
    const { resources } = await facilitiesContainer.items.query<Facility>(querySpec).fetchAll();
    return NextResponse.json(resources, { status: 200 });
  } catch (error) {
    console.error('Get All Facilities API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Create a new facility (Super Admin only)
export async function POST(request: NextRequest) {
  const societyId = await getSocietyId(request);
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
//   if (!isSuperAdmin(request)) {
//     return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
//   }

  try {
    const body = typeof request.body === 'object' ? request.body : await request.json();
    const { name, description, capacity, bookingRules } = body;

    if (!name) {
      return NextResponse.json({ message: 'Facility name is required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newFacility: Facility = {
      id: uuidv4(),
      name,
      description,
      capacity,
      bookingRules,
      isActive: true, // Default to active
      createdAt: now,
      updatedAt: now,
      societyId,
    };

    const { resource: createdFacility } = await facilitiesContainer.items.create(newFacility);

    if (!createdFacility) {
      return NextResponse.json({ message: 'Failed to create facility' }, { status: 500 });
    }
    return NextResponse.json(createdFacility, { status: 201 });
  } catch (error) {
    console.error('Create Facility API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

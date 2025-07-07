// src/app/api/societies/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { safeGetSocietiesContainer, safeGetSocietySettingsContainer } from '@/lib/cosmosdb';
import type { Society, SocietyInfoSettings } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { USER_ROLES } from '@/lib/constants'; // For admin check placeholder

// Placeholder for robust authentication and role check
// In a real app, you'd get the authenticated user's session/token and verify their role.
const isSuperAdmin = (request: NextRequest): boolean => {
  // This is a placeholder. Implement actual superadmin check.
  // For example, if you have a user object in a session:
  // const user = await getSessionUser(request); // Fictional function
  // return user?.primaryRole === USER_ROLES.OWNER_APP;
  return true; // !!IMPORTANT!! Replace with actual admin check
};

// Create a new society (Super Admin only)
export async function POST(request: NextRequest) {
  const societiesContainer = safeGetSocietiesContainer();
  const societySettingsContainer = safeGetSocietySettingsContainer();
  if (!societiesContainer) {
    return NextResponse.json({ message: 'Societies container not available. Check Cosmos DB configuration.' }, { status: 500 });
  }
  if (!societySettingsContainer) {
    return NextResponse.json({ message: 'SocietySettings container not available. Check Cosmos DB configuration.' }, { status: 500 });
  }

  // if (!isSuperAdmin(request)) {
  //   return NextResponse.json({ message: 'Unauthorized: Only Super Admins can create societies.' }, { status: 403 });
  // }

  try {
    const body = await request.json() as { name: string; pincode?: string; city?: string; state?: string; country?: string };
    const { name, pincode, city, state, country } = body;

    if (!name || !city || !state || !country || !pincode) {
      return NextResponse.json({ message: 'Society name, pincode, city, state, and country are required.' }, { status: 400 });
    }

    // Check if society with the same name already exists (optional, but good practice)
    const querySpec = {
      query: "SELECT * FROM c WHERE LOWER(c.name) = @name",
      parameters: [{ name: "@name", value: name.toLowerCase() }]
    };
    const { resources: existingSocieties } = await societiesContainer.items.query<Society>(querySpec).fetchAll();
    if (existingSocieties.length > 0) {
      return NextResponse.json({ message: `A society with the name \"${name}\" already exists.` }, { status: 409 });
    }

    const now = new Date().toISOString();
    const newSocietyId = uuidv4();

    const newSociety: Society = {
      id: newSocietyId,
      name,
      pincode,
      city,
      state,
      country,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const { resource: createdSociety } = await societiesContainer.items.create(newSociety);

    if (!createdSociety) {
      return NextResponse.json({ message: 'Failed to create society.' }, { status: 500 });
    }

    // Also create a default SocietyInfoSettings document for this new society
    const defaultSocietyInfo: SocietyInfoSettings = {
      id: newSocietyId, 
      societyId: newSocietyId, // Explicitly link to the society
      societyName: name, // Pre-fill with the society name
      pincode,
      city,
      state,
      country,
      registrationNumber: '',
      address: '',
      contactEmail: '',
      contactPhone: '',
      updatedAt: now,
    };
    try {
      await societySettingsContainer.items.create(defaultSocietyInfo);
    } catch (settingsError: any) {
      // Log this error but don't fail the society creation itself
      console.error(`Society ${newSocietyId} created, but failed to create default SocietyInfoSettings for it:`, settingsError.message || settingsError);
    }

    return NextResponse.json(createdSociety, { status: 201 });

  } catch (error: any) {
    console.error('Create Society API error:', error.message || error);
    return NextResponse.json({ message: 'Internal server error while creating society.', error: error.message || String(error) }, { status: 500 });
  }
}

// Get all active societies (for public list, e.g., registration dropdown)
export async function GET(request: NextRequest) {
  const societiesContainer = safeGetSocietiesContainer();
  if (!societiesContainer) {
    throw new Error('Societies container not available. Check Cosmos DB configuration.');
  }
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const pincode = searchParams.get('pincode');
    let query = "SELECT c.id, c.name, c.city, c.pincode FROM c WHERE c.isActive = true";
    const parameters: any[] = [];
    if (name) {
      query += " AND CONTAINS(LOWER(c.name), @name)";
      parameters.push({ name: "@name", value: name.toLowerCase() });
    }
    if (pincode) {
      query += " AND c.pincode = @pincode";
      parameters.push({ name: "@pincode", value: pincode });
    }
    query += " ORDER BY c.name ASC";
    const querySpec = parameters.length > 0 ? { query, parameters } : { query };
    const { resources } = await societiesContainer.items.query(querySpec).fetchAll();
    return NextResponse.json(resources, { status: 200 });
  } catch (error: any) {
    console.error('Get Active Societies List API error:', error.message || error);
    return NextResponse.json({ message: 'Internal server error while fetching active societies list.', error: error.message || String(error) }, { status: 500 });
  }
}

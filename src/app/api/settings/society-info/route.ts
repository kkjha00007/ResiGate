// src/app/api/settings/society-info/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { societySettingsContainer } from '@/lib/cosmosdb';
import type { SocietyInfoSettings } from '@/lib/types';
import { USER_ROLES } from '@/lib/constants';

// Helper to check if user is superadmin (replace with your actual auth check)
const isSuperAdmin = (request: NextRequest): boolean => {
  // This is a placeholder. In a real app, you would verify the user's session/token.
  // For now, assuming this check is handled by middleware or client-side routing logic.
  return true; // !!IMPORTANT!!: Replace with actual robust admin check
};

const SOCIETY_INFO_DOC_ID = "societyInfoDoc";

// Get current society info settings
export async function GET(request: NextRequest) {
  const societyId = request.nextUrl.searchParams.get('societyId');
  if (!societyId) {
    return NextResponse.json({ message: 'Society ID is required.' }, { status: 400 });
  }
  try {
    const { resource } = await societySettingsContainer.item(societyId, societyId).read<SocietyInfoSettings>();
    if (!resource) {
      // Return default empty structure if not found, so client can still render the form
      const defaultSettings: SocietyInfoSettings = {
        id: societyId,
        societyId: societyId, // Add required field
        societyName: '',
        registrationNumber: '',
        address: '',
        contactEmail: '',
        contactPhone: '',
        importantContacts: [], // Default empty contacts
      };
      return NextResponse.json(defaultSettings, { status: 200 });
    }
    // Ensure importantContacts is always present
    if (!('importantContacts' in resource)) {
      resource.importantContacts = [];
    }
    return NextResponse.json(resource, { status: 200 });
  } catch (error: any) {
    if (error.code === 404) { // Cosmos DB not found error code
      const defaultSettings: SocietyInfoSettings = {
        id: societyId,
        societyId: societyId, // Add required field
        societyName: '',
        registrationNumber: '',
        address: '',
        contactEmail: '',
        contactPhone: '',
        importantContacts: [],
      };
      return NextResponse.json(defaultSettings, { status: 200 });
    }
    console.error('Get Society Info API error:', error);
    return NextResponse.json({ message: 'Internal server error fetching society info' }, { status: 500 });
  }
}

// Update society info settings (Super Admin only)
export async function PUT(request: NextRequest) {
  if (!isSuperAdmin(request)) {
    return NextResponse.json({ message: 'Unauthorized: Only Super Admins can update society info.' }, { status: 403 });
  }

  try {
    const body = await request.json() as Partial<SocietyInfoSettings>;
    const societyId = body.societyId;
    if (!societyId) {
      return NextResponse.json({ message: 'Society ID is required.' }, { status: 400 });
    }
    // Read the existing unified settings document
    let { resource: existing } = await societySettingsContainer.item(societyId, societyId).read<any>();
    if (!existing) {
      existing = { id: societyId, societyId };
    }
    // Merge new society info and important contacts into the existing doc
    const merged = {
      ...existing,
      societyName: body.societyName ?? existing.societyName ?? '',
      registrationNumber: body.registrationNumber ?? existing.registrationNumber ?? '',
      address: body.address ?? existing.address ?? '',
      contactEmail: body.contactEmail ?? existing.contactEmail ?? '',
      contactPhone: body.contactPhone ?? existing.contactPhone ?? '',
      importantContacts: body.importantContacts ?? existing.importantContacts ?? [],
      updatedAt: new Date().toISOString(),
    };
    const { resource: updatedSettings } = await societySettingsContainer.items.upsert(merged);
    if (!updatedSettings) {
      return NextResponse.json({ message: 'Failed to update society information' }, { status: 500 });
    }
    return NextResponse.json(updatedSettings, { status: 200 });
  } catch (error) {
    console.error('Update Society Info API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error updating society info', error: errorMessage }, { status: 500 });
  }
}

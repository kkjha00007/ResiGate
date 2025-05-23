
// src/app/api/vendors/admin/pending/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { vendorsContainer } from '@/lib/cosmosdb';
import type { Vendor } from '@/lib/types';

// Get all PENDING vendors (for Super Admin approval queue)
export async function GET(request: NextRequest) {
  try {
    // TODO: Add robust authentication and authorization (Super Admin only)
    // For now, assuming client-side routing restricts access appropriately.

    const querySpec = {
      query: "SELECT * FROM c WHERE c.isApproved = false ORDER BY c.submittedAt ASC"
    };

    const { resources: pendingVendors } = await vendorsContainer.items.query<Vendor>(querySpec).fetchAll();

    return NextResponse.json(pendingVendors, { status: 200 });

  } catch (error) {
    console.error('Get Pending Vendors (Admin) API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

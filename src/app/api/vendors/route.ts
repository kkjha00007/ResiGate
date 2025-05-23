
// src/app/api/vendors/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { vendorsContainer } from '@/lib/cosmosdb';
import type { Vendor, VendorCategory } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// Submit a new vendor (will be unapproved by default)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
        name, 
        category, 
        phoneNumber, 
        servicesOffered,
        contactPerson,
        alternatePhoneNumber,
        address,
        notes,
        submittedByUserId, // Should come from authenticated user session on client
        submittedByName,   // Should come from authenticated user session on client
    } = body as Omit<Vendor, 'id' | 'submittedAt' | 'isApproved' | 'approvedByUserId' | 'approvedAt'>;

    if (!name || !category || !phoneNumber || !servicesOffered || !submittedByUserId || !submittedByName) {
      return NextResponse.json({ message: 'Missing required fields for vendor submission' }, { status: 400 });
    }

    const newVendor: Vendor = {
      id: uuidv4(),
      name,
      category: category as VendorCategory,
      contactPerson,
      phoneNumber,
      alternatePhoneNumber,
      address,
      servicesOffered,
      submittedByUserId,
      submittedByName,
      submittedAt: new Date().toISOString(),
      isApproved: false, // New vendors are not approved by default
      notes,
    };

    const { resource: createdVendor } = await vendorsContainer.items.create(newVendor);

    if (!createdVendor) {
      return NextResponse.json({ message: 'Failed to submit vendor for review' }, { status: 500 });
    }

    return NextResponse.json(createdVendor, { status: 201 });

  } catch (error) {
    console.error('Submit Vendor API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

// Get all APPROVED vendors
export async function GET(request: NextRequest) {
  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.isApproved = true ORDER BY c.name ASC"
    };

    const { resources: approvedVendors } = await vendorsContainer.items.query<Vendor>(querySpec).fetchAll();

    return NextResponse.json(approvedVendors, { status: 200 });

  } catch (error) {
    console.error('Get Approved Vendors API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

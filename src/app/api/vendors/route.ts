// src/app/api/vendors/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getVendorsContainer } from '@/lib/cosmosdb';
import type { Vendor, VendorCategory } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// Submit a new vendor (will be unapproved by default)
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid or missing JSON body' }, { status: 400 });
  }
  let societyId = body.societyId || request.headers.get('x-society-id') || request.nextUrl.searchParams.get('societyId');
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  societyId = societyId.trim(); // Remove whitespace just in case
  let vendorsContainer;
  try {
    vendorsContainer = getVendorsContainer();
  } catch (err) {
    return NextResponse.json({ message: 'Cosmos DB connection is not configured.' }, { status: 500 });
  }
  try {
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
      societyId, // Ensure vendor is linked to the correct society
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
  let societyId = request.headers.get('x-society-id') || request.nextUrl.searchParams.get('societyId');
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  societyId = societyId.trim();
  let vendorsContainer;
  try {
    vendorsContainer = getVendorsContainer();
  } catch (err) {
    return NextResponse.json({ message: 'Cosmos DB connection is not configured.' }, { status: 500 });
  }
  const querySpec = {
    query: "SELECT * FROM c WHERE c.isApproved = true AND c.societyId = @societyId ORDER BY c.name ASC",
    parameters: [
      { name: "@societyId", value: societyId }
    ]
  };
  try {
    const { resources: approvedVendors } = await vendorsContainer.items.query<Vendor>(querySpec, { partitionKey: societyId }).fetchAll();
    return NextResponse.json(approvedVendors, { status: 200 });
  } catch (error) {
    console.error('Get Approved Vendors API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

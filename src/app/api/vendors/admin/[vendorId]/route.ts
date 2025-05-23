
// src/app/api/vendors/admin/[vendorId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { vendorsContainer } from '@/lib/cosmosdb';
import type { Vendor } from '@/lib/types';

// Approve a vendor or update its details (Super Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    // TODO: Add robust authentication and authorization (Super Admin only)
    const vendorId = params.vendorId;
    const { isApproved, approvedByUserId, ...otherUpdates } = await request.json(); // approvedByUserId should come from authenticated admin session

    if (!vendorId) {
      return NextResponse.json({ message: 'Vendor ID is required' }, { status: 400 });
    }

    // Fetch the existing vendor to get its partition key (category)
    const querySpec = {
        query: "SELECT * FROM c WHERE c.id = @vendorId",
        parameters: [{ name: "@vendorId", value: vendorId }]
    };
    const { resources: existingVendors } = await vendorsContainer.items.query<Vendor>(querySpec).fetchAll();

    if (existingVendors.length === 0) {
        return NextResponse.json({ message: 'Vendor not found' }, { status: 404 });
    }
    const existingVendor = existingVendors[0];
    const vendorCategoryForPartitionKey = existingVendor.category;


    const updatedVendorData: Partial<Vendor> = { ...otherUpdates };

    if (isApproved === true) {
      updatedVendorData.isApproved = true;
      updatedVendorData.approvedByUserId = approvedByUserId; // This should ideally be the ID of the admin performing the action
      updatedVendorData.approvedAt = new Date().toISOString();
    } else if (isApproved === false) { // Explicitly setting to false, e.g. revoking approval
        updatedVendorData.isApproved = false;
        updatedVendorData.approvedByUserId = undefined;
        updatedVendorData.approvedAt = undefined;
    }
    // If isApproved is not in the request, it means only other details are being updated.

    const finalVendorData: Vendor = {
        ...existingVendor,
        ...updatedVendorData,
        id: existingVendor.id, // Ensure ID is not changed
        category: existingVendor.category, // Ensure partition key is not changed
    };
    
    const { resource: replacedVendor } = await vendorsContainer.item(vendorId, vendorCategoryForPartitionKey).replace(finalVendorData);

    if (!replacedVendor) {
        return NextResponse.json({ message: 'Failed to update vendor' }, { status: 500 });
    }

    return NextResponse.json(replacedVendor, { status: 200 });

  } catch (error) {
    console.error(`Update Vendor ${params.vendorId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

// Reject (Delete) a vendor submission (Super Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    // TODO: Add robust authentication and authorization (Super Admin only)
    const vendorId = params.vendorId;

    if (!vendorId) {
      return NextResponse.json({ message: 'Vendor ID is required' }, { status: 400 });
    }
    
    const querySpec = {
        query: "SELECT * FROM c WHERE c.id = @vendorId",
        parameters: [{ name: "@vendorId", value: vendorId }]
    };
    const { resources: existingVendors } = await vendorsContainer.items.query<Vendor>(querySpec).fetchAll();

    if (existingVendors.length === 0) {
        return NextResponse.json({ message: 'Vendor not found to delete' }, { status: 404 });
    }
    const vendorToDelete = existingVendors[0];
    const vendorCategoryForPartitionKey = vendorToDelete.category;

    await vendorsContainer.item(vendorId, vendorCategoryForPartitionKey).delete();
    
    return NextResponse.json({ message: `Vendor submission ${vendorId} rejected and deleted successfully` }, { status: 200 });

  } catch (error) {
    console.error(`Delete Vendor ${params.vendorId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    if ((error as any)?.code === 404) { 
        return NextResponse.json({ message: 'Vendor not found or already deleted' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

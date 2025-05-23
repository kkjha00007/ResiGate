
// src/app/api/settings/payment-details/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { societySettingsContainer } from '@/lib/cosmosdb';
import type { SocietyPaymentDetails } from '@/lib/types';
import { USER_ROLES } from '@/lib/constants';
// import { getAuth } from '@clerk/nextjs/server'; // Placeholder for actual auth

// Helper to check if user is superadmin (replace with your actual auth check)
const isSuperAdmin = (request: NextRequest): boolean => {
  // This is a placeholder. In a real app, you would get the authenticated user's
  // session and check their role. For example, by decoding a JWT from an Authorization header,
  // or checking a session cookie managed by NextAuth.js or Clerk.
  // For now, we'll assume a basic check or that this is handled by middleware.
  // const { userId, sessionClaims } = getAuth(request); // Example if using Clerk
  // return sessionClaims?.metadata.role === USER_ROLES.SUPERADMIN;
  return true; // !!IMPORTANT!!: Replace with actual robust admin check based on your auth setup
};

const PAYMENT_DETAILS_DOC_ID = "paymentDetailsDoc";

// Get current payment details
export async function GET(request: NextRequest) {
  try {
    const { resource } = await societySettingsContainer.item(PAYMENT_DETAILS_DOC_ID, PAYMENT_DETAILS_DOC_ID).read<SocietyPaymentDetails>();
    if (!resource) {
      // Return default empty structure if not found, so client can still render the form
      const defaultDetails: SocietyPaymentDetails = {
        id: PAYMENT_DETAILS_DOC_ID,
        bankName: '',
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        branchName: '',
        accountType: '',
        upiId: '',
      };
      return NextResponse.json(defaultDetails, { status: 200 });
    }
    return NextResponse.json(resource, { status: 200 });
  } catch (error: any) {
    if (error.code === 404) {
        const defaultDetails: SocietyPaymentDetails = {
            id: PAYMENT_DETAILS_DOC_ID,
            bankName: '',
            accountHolderName: '',
            accountNumber: '',
            ifscCode: '',
            branchName: '',
            accountType: '',
            upiId: '',
          };
        return NextResponse.json(defaultDetails, { status: 200 });
    }
    console.error('Get Payment Details API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Update payment details (Super Admin only)
export async function PUT(request: NextRequest) {
//   if (!isSuperAdmin(request)) { // Placeholder for actual superadmin check
//     return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
//   }

  try {
    const body = await request.json() as Omit<SocietyPaymentDetails, 'id' | 'updatedAt'>;
    
    const itemToUpsert: SocietyPaymentDetails = {
      ...body,
      id: PAYMENT_DETAILS_DOC_ID, // Ensure the ID is always this fixed value
      updatedAt: new Date().toISOString(),
    };

    const { resource: updatedDetails } = await societySettingsContainer.items.upsert(itemToUpsert);

    if (!updatedDetails) {
      return NextResponse.json({ message: 'Failed to update payment details' }, { status: 500 });
    }
    return NextResponse.json(updatedDetails, { status: 200 });
  } catch (error) {
    console.error('Update Payment Details API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

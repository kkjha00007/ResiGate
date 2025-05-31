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

const getSocietyId = (request: NextRequest): string | null => {
  return (
    request.headers.get('x-society-id') ||
    request.nextUrl.searchParams.get('societyId') ||
    null
  );
};

// Get current payment details for a society
export async function GET(request: NextRequest) {
  const societyId = getSocietyId(request);
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  try {
    const { resource } = await societySettingsContainer.item(societyId, societyId).read<SocietyPaymentDetails>();
    if (!resource) {
      const defaultDetails: SocietyPaymentDetails = {
        id: societyId,
        societyId,
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
        id: societyId,
        societyId,
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
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// Update payment details for a society
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid or missing JSON body' }, { status: 400 });
  }
  const societyId = body.societyId || getSocietyId(request);
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  try {
    // Cosmos DB upsert uses the partition key from the document itself.
    // Ensure the document has the correct societyId (partition key) and id fields.
    const paymentDetails: SocietyPaymentDetails = {
      id: societyId,
      societyId,
      bankName: body.bankName || '',
      accountHolderName: body.accountHolderName || '',
      accountNumber: body.accountNumber || '',
      ifscCode: body.ifscCode || '',
      branchName: body.branchName || '',
      accountType: body.accountType || '',
      upiId: body.upiId || '',
    };
    // Do NOT pass a partitionKey option here; the SDK uses paymentDetails.societyId automatically.
    const { resource } = await societySettingsContainer.items.upsert(paymentDetails);
    return NextResponse.json(resource, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// Update payment details for a society (PUT, same as POST)
export async function PUT(request: NextRequest) {
  // Reuse the POST logic for upsert
  return POST(request);
}

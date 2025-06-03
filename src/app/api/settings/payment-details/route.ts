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
    const { resource } = await societySettingsContainer.item(societyId, societyId).read<any>();
    if (!resource) {
      // Return default structure for payment details
      const defaultDetails = {
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
    // Return only the paymentDetails field if present, else fallback to top-level fields for backward compatibility
    if (resource.paymentDetails) {
      return NextResponse.json(resource.paymentDetails, { status: 200 });
    } else {
      // fallback for legacy docs
      const details = {
        bankName: resource.bankName || '',
        accountHolderName: resource.accountHolderName || '',
        accountNumber: resource.accountNumber || '',
        ifscCode: resource.ifscCode || '',
        branchName: resource.branchName || '',
        accountType: resource.accountType || '',
        upiId: resource.upiId || '',
      };
      return NextResponse.json(details, { status: 200 });
    }
  } catch (error: any) {
    if (error.code === 404) {
      const defaultDetails = {
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

// Update payment details for a society (merge into unified doc)
async function updatePaymentDetails(request: NextRequest) {
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
    // Read existing doc
    let { resource: existing } = await societySettingsContainer.item(societyId, societyId).read<any>();
    if (!existing) {
      existing = { id: societyId, societyId };
    }
    // Merge payment details into the doc
    const merged = {
      ...existing,
      paymentDetails: {
        bankName: body.bankName || '',
        accountHolderName: body.accountHolderName || '',
        accountNumber: body.accountNumber || '',
        ifscCode: body.ifscCode || '',
        branchName: body.branchName || '',
        accountType: body.accountType || '',
        upiId: body.upiId || '',
      },
      updatedAt: new Date().toISOString(),
    };
    const { resource } = await societySettingsContainer.items.upsert(merged);
    // Return the merged paymentDetails (resource may be undefined)
    return NextResponse.json(merged.paymentDetails, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return updatePaymentDetails(request);
}

export async function PUT(request: NextRequest) {
  return updatePaymentDetails(request);
}

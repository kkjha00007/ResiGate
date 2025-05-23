
// src/app/api/committee-members/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { committeeMembersContainer } from '@/lib/cosmosdb';
import type { CommitteeMember } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
// import { getAuth } from '@clerk/nextjs/server'; // Placeholder if using Clerk for auth

// Helper to check if user is superadmin (replace with your actual auth check)
const isSuperAdmin = (request: NextRequest): boolean => {
  // This is a placeholder. In a real app, you would get the authenticated user's
  // session and check their role. For SWA, this might involve checking headers
  // set by the SWA authentication.
  // For now, we'll assume this check is handled elsewhere or allow for demo purposes.
  // const { userId, sessionClaims } = getAuth(request);
  // return sessionClaims?.metadata.role === 'superadmin';
  return true; // !!IMPORTANT!!: Replace with actual admin check
};

// Get all committee members
export async function GET(request: NextRequest) {
  try {
    const querySpec = {
      query: "SELECT * FROM c ORDER BY c.name ASC"
    };
    const { resources } = await committeeMembersContainer.items.query<CommitteeMember>(querySpec).fetchAll();
    return NextResponse.json(resources, { status: 200 });
  } catch (error) {
    console.error('Get Committee Members API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Add a new committee member (Super Admin only)
export async function POST(request: NextRequest) {
  // if (!isSuperAdmin(request)) {
  //   return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  // }

  try {
    const body = await request.json() as Omit<CommitteeMember, 'id' | 'createdAt' | 'updatedAt'>;
    const { name, roleInCommittee, flatNumber } = body;

    if (!name || !roleInCommittee || !flatNumber) {
      return NextResponse.json({ message: 'Missing required fields: name, roleInCommittee, flatNumber' }, { status: 400 });
    }

    const newMember: CommitteeMember = {
      id: uuidv4(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { resource: createdMember } = await committeeMembersContainer.items.create(newMember);

    if (!createdMember) {
      return NextResponse.json({ message: 'Failed to add committee member' }, { status: 500 });
    }
    return NextResponse.json(createdMember, { status: 201 });
  } catch (error) {
    console.error('Add Committee Member API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

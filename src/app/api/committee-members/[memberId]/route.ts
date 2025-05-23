
// src/app/api/committee-members/[memberId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { committeeMembersContainer } from '@/lib/cosmosdb';
import type { CommitteeMember } from '@/lib/types';

// Helper to check if user is superadmin (replace with your actual auth check)
const isSuperAdmin = (request: NextRequest): boolean => {
  // Placeholder - implement actual admin check
  return true;
};

// Get a specific committee member by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const memberId = params.memberId;
    if (!memberId) {
      return NextResponse.json({ message: 'Member ID is required' }, { status: 400 });
    }

    const { resource } = await committeeMembersContainer.item(memberId, memberId).read<CommitteeMember>();
    if (!resource) {
      return NextResponse.json({ message: 'Committee member not found' }, { status: 404 });
    }
    return NextResponse.json(resource, { status: 200 });
  } catch (error) {
    console.error(`Get Committee Member ${params.memberId} API error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Update a committee member (Super Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  // if (!isSuperAdmin(request)) {
  //   return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  // }

  try {
    const memberId = params.memberId;
    const updates = await request.json() as Partial<Omit<CommitteeMember, 'id' | 'createdAt' | 'updatedAt'>>;

    if (!memberId) {
      return NextResponse.json({ message: 'Member ID is required' }, { status: 400 });
    }

    const { resource: existingMember } = await committeeMembersContainer.item(memberId, memberId).read<CommitteeMember>();
    if (!existingMember) {
      return NextResponse.json({ message: 'Committee member not found' }, { status: 404 });
    }

    const updatedMemberData: CommitteeMember = {
      ...existingMember,
      ...updates,
      id: existingMember.id, // Ensure ID is not changed
      updatedAt: new Date().toISOString(),
    };
    
    const { resource: replacedMember } = await committeeMembersContainer.item(memberId, memberId).replace(updatedMemberData);

    if (!replacedMember) {
        return NextResponse.json({ message: 'Failed to update committee member' }, { status: 500 });
    }
    return NextResponse.json(replacedMember, { status: 200 });
  } catch (error) {
    console.error(`Update Committee Member ${params.memberId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

// Delete a committee member (Super Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  // if (!isSuperAdmin(request)) {
  //   return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  // }

  try {
    const memberId = params.memberId;
    if (!memberId) {
      return NextResponse.json({ message: 'Member ID is required' }, { status: 400 });
    }
    
    await committeeMembersContainer.item(memberId, memberId).delete();
    
    return NextResponse.json({ message: `Committee member ${memberId} deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error(`Delete Committee Member ${params.memberId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    if ((error as any)?.code === 404) {
        return NextResponse.json({ message: 'Committee member not found or already deleted' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

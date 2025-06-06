// src/app/api/committee-members/[memberId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { safeGetCommitteeMembersContainer } from '@/lib/cosmosdb';
import type { CommitteeMember } from '@/lib/types';
import { logAuditAction } from '@/lib/utils';

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

    const committeeMembersContainer = safeGetCommitteeMembersContainer();
    if (!committeeMembersContainer) {
      return NextResponse.json({ message: 'CommitteeMembers container not available. Check Cosmos DB configuration.' }, { status: 500 });
    }

    // Try reading with memberId as partition key (new data)
    let { resource } = await committeeMembersContainer.item(memberId, memberId).read<CommitteeMember>();
    if (!resource) {
      // Fallback: query for member by id to get actual partition key (legacy data)
      const query = {
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: memberId }],
      };
      const { resources } = await committeeMembersContainer.items.query(query).fetchAll();
      const fallbackMember = resources[0] as CommitteeMember | undefined;
      if (!fallbackMember) {
        return NextResponse.json({ message: 'Committee member not found' }, { status: 404 });
      }
      return NextResponse.json(fallbackMember, { status: 200 });
    }
    return NextResponse.json(resource as CommitteeMember, { status: 200 });
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

    const committeeMembersContainer = safeGetCommitteeMembersContainer();
    if (!committeeMembersContainer) {
      return NextResponse.json({ message: 'CommitteeMembers container not available. Check Cosmos DB configuration.' }, { status: 500 });
    }

    // Try reading with memberId as partition key (new data)
    let { resource: existingMember } = await committeeMembersContainer.item(memberId, memberId).read<CommitteeMember>();
    let partitionKey = memberId;
    let memberToUpdate: CommitteeMember | undefined = existingMember;
    if (!existingMember) {
      // Fallback: query for member by id to get actual partition key (legacy data)
      const query = {
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: memberId }],
      };
      const { resources } = await committeeMembersContainer.items.query(query).fetchAll();
      const fallbackMember = resources[0] as CommitteeMember | undefined;
      if (!fallbackMember) {
        return NextResponse.json({ message: 'Committee member not found' }, { status: 404 });
      }
      memberToUpdate = fallbackMember;
      partitionKey = fallbackMember.societyId;
    }
    if (!memberToUpdate || !memberToUpdate.societyId || !memberToUpdate.name || !memberToUpdate.roleInCommittee || !memberToUpdate.flatNumber) {
      return NextResponse.json({ message: 'Committee member data is incomplete or corrupt' }, { status: 500 });
    }
    const updatedMemberData: CommitteeMember = {
      ...memberToUpdate,
      ...updates,
      id: memberToUpdate.id, // Ensure ID is not changed
      societyId: memberToUpdate.societyId,
      name: memberToUpdate.name,
      roleInCommittee: memberToUpdate.roleInCommittee,
      flatNumber: memberToUpdate.flatNumber,
      updatedAt: new Date().toISOString(),
    };
    const { resource: replacedMember } = await committeeMembersContainer.item(memberId, partitionKey).replace(updatedMemberData);
    if (!replacedMember) {
        return NextResponse.json({ message: 'Failed to update committee member' }, { status: 500 });
    }
    // Audit log
    try {
      const userId = request.headers.get('x-user-id') || 'unknown';
      const userName = request.headers.get('x-user-name') || 'unknown';
      const userRole = request.headers.get('x-user-role') || 'unknown';
      const validRoles = ["superadmin", "societyAdmin", "owner", "renter", "guard"];
      const safeUserRole = validRoles.includes(userRole) ? userRole : "superadmin";
      await logAuditAction({
        societyId: updatedMemberData.societyId,
        userId,
        userName,
        userRole: safeUserRole as import('@/lib/types').UserRole,
        action: 'update',
        targetType: 'CommitteeMember',
        targetId: replacedMember.id,
        details: updates
      });
    } catch (e) { console.error('Audit log failed:', e); }
    return NextResponse.json(replacedMember as CommitteeMember, { status: 200 });
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

    const committeeMembersContainer = safeGetCommitteeMembersContainer();
    if (!committeeMembersContainer) {
      return NextResponse.json({ message: 'CommitteeMembers container not available. Check Cosmos DB configuration.' }, { status: 500 });
    }

    // Try reading with memberId as partition key (new data)
    let { resource: member } = await committeeMembersContainer.item(memberId, memberId).read<CommitteeMember>();
    let partitionKey = memberId;
    let memberToDelete: CommitteeMember | undefined = member;
    if (!member) {
      // Fallback: query for member by id to get actual partition key (legacy data)
      const query = {
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: memberId }],
      };
      const { resources } = await committeeMembersContainer.items.query(query).fetchAll();
      const fallbackMember = resources[0] as CommitteeMember | undefined;
      if (!fallbackMember) {
        return NextResponse.json({ message: 'Committee member not found or already deleted' }, { status: 404 });
      }
      memberToDelete = fallbackMember;
      partitionKey = fallbackMember.societyId;
    }
    await committeeMembersContainer.item(memberId, partitionKey).delete();
    // Audit log
    try {
      const userId = request.headers.get('x-user-id') || 'unknown';
      const userName = request.headers.get('x-user-name') || 'unknown';
      const userRole = request.headers.get('x-user-role') || 'unknown';
      const validRoles = ["superadmin", "societyAdmin", "owner", "renter", "guard"];
      const safeUserRole = validRoles.includes(userRole) ? userRole : "superadmin";
      await logAuditAction({
        societyId: memberToDelete?.societyId || 'unknown',
        userId,
        userName,
        userRole: safeUserRole as import('@/lib/types').UserRole,
        action: 'delete',
        targetType: 'CommitteeMember',
        targetId: memberId,
        details: {}
      });
    } catch (e) { console.error('Audit log failed:', e); }
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


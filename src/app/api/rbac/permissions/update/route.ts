// src/app/api/rbac/permissions/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, getUserById, logAuditAction } from '@/lib/server-utils';
import { getUsersContainer } from '@/lib/cosmosdb';
import type { User, UserRoleAssociation } from '@/lib/types';

/**
 * Update custom permissions for a user's role association
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, societyId, roleAssociationId, customPermissions } = body;

    if (!userId || !societyId || !roleAssociationId || !customPermissions) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Verify authentication
    const token = req.cookies.get('session')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
    }

    const currentUser = await getUserById(payload.userId, payload.societyId || 'default');
    if (!currentUser) {
      return NextResponse.json({ message: 'Current user not found' }, { status: 404 });
    }

    // Check if current user has permission to update permissions
    const canUpdatePermissions = currentUser.roleAssociations?.some((association: UserRoleAssociation) => 
      association.isActive && ['owner_app', 'ops'].includes(association.role)
    ) || ['owner_app', 'ops'].includes(currentUser.primaryRole);

    if (!canUpdatePermissions) {
      return NextResponse.json({ message: 'Insufficient permissions to update permissions' }, { status: 403 });
    }

    // Get target user
    const targetUser = await getUserById(userId, societyId);
    if (!targetUser) {
      return NextResponse.json({ message: 'Target user not found' }, { status: 404 });
    }

    // Find and update the specific role association
    const updatedAssociations = (targetUser.roleAssociations || []).map((association: UserRoleAssociation) => {
      if (association.id === roleAssociationId) {
        return {
          ...association,
          customPermissions
        };
      }
      return association;
    });

    // Update user in database
    const usersContainer = await getUsersContainer();
    const updatedUser = {
      ...targetUser,
      roleAssociations: updatedAssociations
    };

    await usersContainer.item(userId, societyId).replace(updatedUser);

    // Log audit action
    await logAuditAction({
      societyId: societyId,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.primaryRole,
      action: 'UPDATE_PERMISSIONS',
      targetType: 'User',
      targetId: userId,
      details: { 
        targetUserName: targetUser.name,
        roleAssociationId,
        customPermissions
      }
    });

    return NextResponse.json({ 
      message: 'Permissions updated successfully'
    });

  } catch (error) {
    console.error('Error updating permissions:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// src/app/api/rbac/roles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, getUserById, logAuditAction } from '@/lib/server-utils';
import { getUsersContainer } from '@/lib/cosmosdb';
import { LOGIN_ELIGIBLE_ROLES, ROLE_GROUPS, ROLE_TO_GROUP } from '@/lib/constants';
import type { User, UserRoleAssociation } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get all available roles and their metadata
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get('session')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
    }

    const user = await getUserById(payload.userId, payload.societyId || 'default');
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if user has permission to view roles (Owner/Ops only)
    const hasRoleAccess = user.roleAssociations?.some((association: UserRoleAssociation) => 
      association.isActive && ['owner_app', 'ops'].includes(association.role)
    ) || ['owner_app', 'ops'].includes(user.primaryRole);

    if (!hasRoleAccess) {
      return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 });
    }

    return NextResponse.json({
      loginEligibleRoles: LOGIN_ELIGIBLE_ROLES,
      roleGroups: ROLE_GROUPS,
      roleToGroup: ROLE_TO_GROUP
    });

  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Assign or update role associations for a user
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, roleAssociation } = body;

    if (!userId || !roleAssociation) {
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

    // Check if current user has permission to assign roles
    const canAssignRoles = currentUser.roleAssociations?.some((association: UserRoleAssociation) => 
      association.isActive && ['owner_app', 'ops'].includes(association.role)
    ) || ['owner_app', 'ops'].includes(currentUser.primaryRole);

    if (!canAssignRoles) {
      return NextResponse.json({ message: 'Insufficient permissions to assign roles' }, { status: 403 });
    }

    // Get target user
    const targetUser = await getUserById(userId, roleAssociation.societyId || currentUser.societyId || 'default');
    if (!targetUser) {
      return NextResponse.json({ message: 'Target user not found' }, { status: 404 });
    }

    // Create new role association
    const newAssociation: UserRoleAssociation = {
      id: uuidv4(),
      userId: userId,
      role: roleAssociation.role,
      societyId: roleAssociation.societyId,
      flatNumber: roleAssociation.flatNumber,
      isActive: true,
      assignedAt: new Date().toISOString(),
      assignedBy: currentUser.id,
      expiresAt: roleAssociation.expiresAt,
      customPermissions: roleAssociation.customPermissions
    };

    // Update user's role associations
    const updatedAssociations = [...(targetUser.roleAssociations || []), newAssociation];
    
    // Update user in database
    const usersContainer = await getUsersContainer();
    const updatedUser = {
      ...targetUser,
      roleAssociations: updatedAssociations
    };

    await usersContainer.item(userId, roleAssociation.societyId || currentUser.societyId || 'default').replace(updatedUser);

    // Log audit action
    await logAuditAction({
      societyId: roleAssociation.societyId || currentUser.societyId || 'default',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.primaryRole,
      action: 'ASSIGN_ROLE',
      targetType: 'User',
      targetId: userId,
      details: { 
        targetUserName: targetUser.name,
        roleAssociation: newAssociation
      }
    });

    return NextResponse.json({ 
      message: 'Role assigned successfully',
      roleAssociation: newAssociation
    });

  } catch (error) {
    console.error('Error assigning role:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

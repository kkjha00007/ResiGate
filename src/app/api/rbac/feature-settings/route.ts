// src/app/api/rbac/feature-settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, getUserById, logAuditAction } from '@/lib/server-utils';
import { getUsersContainer } from '@/lib/cosmosdb';
import type { User, UserRoleAssociation } from '@/lib/types';

interface RolePermissionSettings {
  role: string;
  roleGroup: string;
  isEnabled: boolean;
  permissions: { [feature: string]: string[] };
}

/**
 * GET feature access settings for roles in a society
 * GET /api/rbac/feature-settings?societyId=...
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const societyId = searchParams.get('societyId');
    if (!societyId) {
      return NextResponse.json({ message: 'Missing required societyId' }, { status: 400 });
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

    // Check if current user has permission to view feature settings
    const canViewFeatures = currentUser.roleAssociations?.some((association: UserRoleAssociation) => 
      association.isActive && ['owner_app', 'ops', 'society_admin'].includes(association.role)
    ) || ['owner_app', 'ops', 'society_admin'].includes(currentUser.primaryRole);
    if (!canViewFeatures) {
      return NextResponse.json({ message: 'Insufficient permissions to view feature settings' }, { status: 403 });
    }

    // Fetch all users in the society
    const usersContainer = await getUsersContainer();
    const query = {
      query: `SELECT * FROM c WHERE c.societyId = @societyId`,
      parameters: [
        { name: "@societyId", value: societyId }
      ]
    };
    const { resources: users } = await usersContainer.items.query<User>(query).fetchAll();

    // Aggregate roleSettings from users' roleAssociations
    const roleSettings: { [role: string]: RolePermissionSettings } = {};
    for (const user of users) {
      (user.roleAssociations || []).forEach(association => {
        if (association.societyId === societyId && association.isActive) {
          if (!roleSettings[association.role]) {
            roleSettings[association.role] = {
              role: association.role,
              roleGroup: '', // You can fill this if you have a mapping
              isEnabled: true,
              permissions: association.customPermissions || {}
            };
          } else {
            // Merge permissions if needed (union of all users)
            const perms = association.customPermissions || {};
            Object.keys(perms).forEach(feature => {
              if (!roleSettings[association.role].permissions[feature]) {
                roleSettings[association.role].permissions[feature] = perms[feature];
              } else {
                // Union
                roleSettings[association.role].permissions[feature] = Array.from(new Set([
                  ...roleSettings[association.role].permissions[feature],
                  ...perms[feature]
                ]));
              }
            });
          }
        }
      });
    }

    return NextResponse.json({ roleSettings });
  } catch (error) {
    console.error('Error fetching feature settings:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Save feature access settings for roles in a society
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { societyId, roleSettings } = body;

    if (!societyId || !roleSettings) {
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

    // Check if current user has permission to manage feature settings
    const canManageFeatures = currentUser.roleAssociations?.some((association: UserRoleAssociation) => 
      association.isActive && ['owner_app', 'ops', 'society_admin'].includes(association.role)
    ) || ['owner_app', 'ops', 'society_admin'].includes(currentUser.primaryRole);

    if (!canManageFeatures) {
      return NextResponse.json({ message: 'Insufficient permissions to manage feature settings' }, { status: 403 });
    }

    const usersContainer = await getUsersContainer();
    
    // Get all users in the society with the affected roles
    const affectedRoles = Object.keys(roleSettings);
    const updatedUsers: string[] = [];

    for (const role of affectedRoles) {
      const rolePermissionSettings: RolePermissionSettings = roleSettings[role];
      
      // Find users with this role in this society
      const query = {
        query: `SELECT * FROM c 
                WHERE c.societyId = @societyId 
                AND (c.primaryRole = @role 
                     OR EXISTS(SELECT VALUE a FROM a IN c.roleAssociations WHERE a.role = @role AND a.societyId = @societyId AND a.isActive = true))`,
        parameters: [
          { name: "@societyId", value: societyId },
          { name: "@role", value: role }
        ]
      };

      const { resources: usersWithRole } = await usersContainer.items.query<User>(query).fetchAll();

      // Update each user's role associations with custom permissions
      for (const user of usersWithRole) {
        let userUpdated = false;
        
        // Update role associations
        const updatedAssociations = (user.roleAssociations || []).map(association => {
          if (association.role === role && association.societyId === societyId && association.isActive) {
            userUpdated = true;
            return {
              ...association,
              customPermissions: rolePermissionSettings.isEnabled ? rolePermissionSettings.permissions : {}
            };
          }
          return association;
        });

        // If user has legacy role structure, create role association
        if (user.primaryRole === role && user.societyId === societyId && !user.roleAssociations?.length) {
          const newAssociation: UserRoleAssociation = {
            id: `rbac-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            role: user.primaryRole,
            societyId: user.societyId!,
            flatNumber: user.flatNumber,
            isActive: true,
            assignedAt: new Date().toISOString(),
            assignedBy: currentUser.id,
            customPermissions: rolePermissionSettings.isEnabled ? rolePermissionSettings.permissions : {}
          };
          updatedAssociations.push(newAssociation);
          userUpdated = true;
        }

        if (userUpdated) {
          const updatedUser = {
            ...user,
            roleAssociations: updatedAssociations
          };

          await usersContainer.item(user.id, societyId).replace(updatedUser);
          updatedUsers.push(user.id);
        }
      }
    }

    // Log audit action
    await logAuditAction({
      societyId: societyId,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.primaryRole,
      action: 'UPDATE_FEATURE_SETTINGS',
      targetType: 'Society',
      targetId: societyId,
      details: { 
        affectedRoles,
        updatedUsersCount: updatedUsers.length,
        roleSettings
      }
    });

    return NextResponse.json({ 
      message: 'Feature settings updated successfully',
      updatedUsersCount: updatedUsers.length,
      affectedRoles
    });

  } catch (error) {
    console.error('Error updating feature settings:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

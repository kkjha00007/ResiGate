// src/app/api/rbac/permissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, getUserById } from '@/lib/server-utils';
import { FEATURES, DEFAULT_ROLE_PERMISSIONS, ROLE_GROUPS, ROLE_TO_GROUP, LOGIN_ELIGIBLE_ROLES } from '@/lib/constants';
import type { User, UserRoleAssociation } from '@/lib/types';

/**
 * Get user's effective permissions for all societies/flats they have access to
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

    // Calculate effective permissions based on role associations
    const effectivePermissions = calculateEffectivePermissions(user);

    return NextResponse.json({
      permissions: effectivePermissions,
      roleAssociations: user.roleAssociations || [],
      isStaff: user.isStaff || false,
      canImpersonate: user.canImpersonate || false
    });

  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

function calculateEffectivePermissions(user: User) {
  const permissions: { [societyId: string]: { [feature: string]: string[] } } = {};
  
  // Get role associations, or create from legacy role if available
  const roleAssociations = user.roleAssociations && user.roleAssociations.length > 0 
    ? user.roleAssociations 
    : (user.primaryRole && user.societyId ? [{
        id: 'legacy',
        userId: user.id,
        role: user.primaryRole,
        societyId: user.societyId,
        flatNumber: user.flatNumber,
        isActive: true,
        assignedAt: new Date().toISOString(),
        assignedBy: 'migration'
      }] : []);

  roleAssociations.forEach(association => {
    if (!association.isActive) return;

    const { societyId, role } = association;
    const safeRole = role as keyof typeof DEFAULT_ROLE_PERMISSIONS;
    const safeSocietyId = societyId || 'unknown';
    
    if (!permissions[safeSocietyId]) {
      permissions[safeSocietyId] = {};
    }

    // Get default permissions for this role
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[safeRole] || {};
    
    // Apply custom permissions if they exist, otherwise use defaults
    const customPermissions = association.customPermissions || {};
    
    Object.keys(FEATURES).forEach(feature => {
      const customFeaturePerms = customPermissions[feature];
      const defaultFeaturePerms = defaultPermissions[feature as keyof typeof defaultPermissions];
      
      if (customFeaturePerms !== undefined) {
        // Use custom permissions
        permissions[safeSocietyId][feature] = customFeaturePerms;
      } else if (Array.isArray(defaultFeaturePerms)) {
        // Use default permissions (ensure it's an array)
        permissions[safeSocietyId][feature] = defaultFeaturePerms;
      } else {
        // No permissions
        permissions[safeSocietyId][feature] = [];
      }
    });
  });

  return permissions;
}

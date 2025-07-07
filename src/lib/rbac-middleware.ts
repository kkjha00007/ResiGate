// src/lib/rbac-middleware.ts
import { NextRequest } from 'next/server';
import { verifyJWT, getUserById } from './server-utils';
import { DEFAULT_ROLE_PERMISSIONS } from './constants';
import type { User, UserRoleAssociation } from './types';

interface RBACOptions {
  requiredPermissions: string[];
  allowSelfAccess?: boolean; // Allow access if user is accessing their own data
  targetUserIdParam?: string; // Parameter name for target user ID
}

/**
 * RBAC middleware to check permissions for API endpoints
 */
export async function checkRBACPermissions(
  req: NextRequest,
  options: RBACOptions
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Get and verify JWT token
    const token = req.cookies.get('session')?.value;
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const payload = await verifyJWT(token);
    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      return { success: false, error: 'Invalid session' };
    }

    // Get user data
    const user = await getUserById(payload.userId, payload.societyId || 'default');
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check if user is accessing their own data (if allowed)
    if (options.allowSelfAccess && options.targetUserIdParam) {
      const url = new URL(req.url);
      const targetUserId = url.searchParams.get(options.targetUserIdParam) || 
                          req.nextUrl.pathname.split('/').pop();
      
      if (targetUserId === user.id) {
        return { success: true, user };
      }
    }

    // Get user's effective permissions
    const userPermissions = getUserEffectivePermissions(user);
    
    // Check if user has all required permissions
    const hasRequiredPermissions = options.requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasRequiredPermissions) {
      return { 
        success: false, 
        error: `Insufficient permissions. Required: ${options.requiredPermissions.join(', ')}` 
      };
    }

    return { success: true, user };

  } catch (error) {
    console.error('RBAC middleware error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get all effective permissions for a user across all their role associations
 */
export function getUserEffectivePermissions(user: User): string[] {
  const allPermissions = new Set<string>();

  // Get role associations, or create from legacy role
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

    const role = association.role as keyof typeof DEFAULT_ROLE_PERMISSIONS;
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[role] || {};
    const customPermissions = association.customPermissions || {};

    // Combine default and custom permissions
    Object.keys(defaultPermissions).forEach(feature => {
      const customFeaturePerms = customPermissions[feature];
      const defaultFeaturePerms = defaultPermissions[feature as keyof typeof defaultPermissions];
      
      if (customFeaturePerms !== undefined) {
        // Use custom permissions
        customFeaturePerms.forEach(perm => allPermissions.add(perm));
      } else if (Array.isArray(defaultFeaturePerms)) {
        // Use default permissions
        defaultFeaturePerms.forEach(perm => allPermissions.add(perm));
      }
    });
  });

  return Array.from(allPermissions);
}

/**
 * Check if user has specific permission for a feature
 */
export function userHasPermission(
  user: User, 
  feature: string, 
  permission: string,
  societyId?: string
): boolean {
  // Get role associations for the specific society (if provided)
  const roleAssociations = user.roleAssociations && user.roleAssociations.length > 0 
    ? user.roleAssociations.filter(assoc => 
        assoc.isActive && (!societyId || assoc.societyId === societyId)
      )
    : (user.primaryRole && (!societyId || user.societyId === societyId) ? [{
        id: 'legacy',
        userId: user.id,
        role: user.primaryRole,
        societyId: user.societyId!,
        flatNumber: user.flatNumber,
        isActive: true,
        assignedAt: new Date().toISOString(),
        assignedBy: 'migration'
      }] : []);

  return roleAssociations.some(association => {
    const role = association.role as keyof typeof DEFAULT_ROLE_PERMISSIONS;
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[role] || {};
    const customPermissions = association.customPermissions || {};

    // Check custom permissions first
    if (customPermissions[feature]) {
      return customPermissions[feature].includes(permission);
    }

    // Fall back to default permissions
    const defaultFeaturePerms = defaultPermissions[feature as keyof typeof defaultPermissions];
    return Array.isArray(defaultFeaturePerms) && defaultFeaturePerms.includes(permission);
  });
}

/**
 * Higher-order function to wrap API route handlers with RBAC
 */
export function withRBAC(
  handler: (req: NextRequest, user: User, ...args: any[]) => Promise<Response>,
  options: RBACOptions
) {
  return async (req: NextRequest, ...args: any[]) => {
    const rbacResult = await checkRBACPermissions(req, options);
    
    if (!rbacResult.success) {
      return new Response(
        JSON.stringify({ message: rbacResult.error }), 
        { 
          status: rbacResult.error === 'Not authenticated' ? 401 : 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return handler(req, rbacResult.user!, ...args);
  };
}

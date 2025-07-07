// src/hooks/use-rbac.ts
import { useMemo } from 'react';
import type { UserProfile, UserRoleAssociation } from '@/lib/types';
import { getUserEffectivePermissions, userHasPermission } from '@/lib/rbac-middleware';

export function useRBAC(user: UserProfile | null) {
  return useMemo(() => {
    if (!user) {
      return {
        permissions: [],
        hasPermission: () => false,
        isAdmin: false,
        isSocietyAdmin: false,
        isOwnerOrRenter: false,
        isGuard: false,
        canImpersonate: false,
        isStaff: false
      };
    }

    const permissions = getUserEffectivePermissions(user);

    const hasAdminRole = user.roleAssociations?.some((association: UserRoleAssociation) => 
      association.isActive && ['owner_app', 'platform_admin', 'society_admin'].includes(association.role)
    ) || ['owner_app', 'platform_admin', 'society_admin', 'superadmin'].includes(user.primaryRole);

    const hasSocietyAdminRole = user.roleAssociations?.some((association: UserRoleAssociation) => 
      association.isActive && association.role === 'society_admin'
    ) || ['society_admin', 'superadmin'].includes(user.primaryRole);

    const hasResidentRole = user.roleAssociations?.some((association: UserRoleAssociation) => 
      association.isActive && ['resident'].includes(association.role)
    ) || ['owner', 'renter', 'resident'].includes(user.primaryRole);

    const hasGuardRole = user.roleAssociations?.some((association: UserRoleAssociation) => 
      association.isActive && association.role === 'guard'
    ) || user.primaryRole === 'guard';

    return {
      permissions,
      hasPermission: (feature: string, permission: string, societyId?: string) =>
        userHasPermission(user, feature, permission, societyId),
      isAdmin: hasAdminRole,
      isSocietyAdmin: hasSocietyAdminRole,
      isOwnerOrRenter: hasResidentRole,
      isGuard: hasGuardRole,
      canImpersonate: user.canImpersonate || false,
      isStaff: user.isStaff || false
    };
  }, [user]);
}

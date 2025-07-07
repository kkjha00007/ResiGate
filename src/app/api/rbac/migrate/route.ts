// src/app/api/rbac/migrate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, getUserById, logAuditAction } from '@/lib/server-utils';
import { getUsersContainer } from '@/lib/cosmosdb';
import type { User, UserRoleAssociation } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Migrate existing users to the new RBAC structure
 * This should be run once after deploying the new RBAC system
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication - only allow super admins or owner_app to run migration
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

    // Check if current user has permission to run migration
    const canRunMigration = currentUser.roleAssociations?.some((association: UserRoleAssociation) => 
      association.isActive && ['owner_app'].includes(association.role)
    ) || ['owner_app', 'superadmin'].includes(currentUser.primaryRole);

    if (!canRunMigration) {
      return NextResponse.json({ message: 'Insufficient permissions to run migration' }, { status: 403 });
    }

    const usersContainer = await getUsersContainer();
    
    // Get all users that need migration (those without roleAssociations)
    const querySpec = {
      query: "SELECT * FROM c WHERE NOT IS_DEFINED(c.roleAssociations) OR ARRAY_LENGTH(c.roleAssociations) = 0"
    };

    const { resources: usersToMigrate } = await usersContainer.items.query<User>(querySpec).fetchAll();
    
    let migratedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const user of usersToMigrate) {
      try {
        // Convert legacy role and society info to role association
        if (user.primaryRole && user.societyId) {
          const roleAssociation: UserRoleAssociation = {
            id: uuidv4(),
            userId: user.id,
            role: user.primaryRole,
            societyId: user.societyId,
            flatNumber: user.flatNumber,
            isActive: true,
            assignedAt: user.registrationDate || new Date().toISOString(),
            assignedBy: 'migration'
          };

          // Update user with new role association structure
          const updatedUser: User = {
            ...user,
            roleAssociations: [roleAssociation]
            // Keep primaryRole and societyId for backward compatibility
          };

          await usersContainer.item(user.id, user.societyId).replace(updatedUser);
          migratedCount++;

          // Log migration action
          await logAuditAction({
            societyId: user.societyId,
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.primaryRole,
            action: 'MIGRATE_USER_RBAC',
            targetType: 'User',
            targetId: user.id,
            details: { 
              targetUserName: user.name,
              migratedRole: user.primaryRole,
              roleAssociation
            }
          });
        } else {
          errors.push(`User ${user.id} (${user.email}) has no primary role or society ID`);
          errorCount++;
        }
      } catch (error) {
        console.error(`Error migrating user ${user.id}:`, error);
        errors.push(`Failed to migrate user ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        errorCount++;
      }
    }

    return NextResponse.json({ 
      message: 'Migration completed',
      migratedCount,
      errorCount,
      totalUsers: usersToMigrate.length,
      errors: errors.slice(0, 10) // Limit errors shown to first 10
    });

  } catch (error) {
    console.error('Error running migration:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Check migration status
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

    const currentUser = await getUserById(payload.userId, payload.societyId || 'default');
    if (!currentUser) {
      return NextResponse.json({ message: 'Current user not found' }, { status: 404 });
    }

    // Check permissions
    const canCheckMigration = currentUser.roleAssociations?.some((association: UserRoleAssociation) => 
      association.isActive && ['owner_app'].includes(association.role)
    ) || ['owner_app', 'superadmin'].includes(currentUser.primaryRole);

    if (!canCheckMigration) {
      return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 });
    }

    const usersContainer = await getUsersContainer();
    
    // Count total users
    const totalUsersQuery = { query: "SELECT VALUE COUNT(1) FROM c" };
    const { resources: totalUsersResult } = await usersContainer.items.query(totalUsersQuery).fetchAll();
    const totalUsers = totalUsersResult[0] || 0;

    // Count migrated users
    const migratedUsersQuery = { 
      query: "SELECT VALUE COUNT(1) FROM c WHERE IS_DEFINED(c.roleAssociations) AND ARRAY_LENGTH(c.roleAssociations) > 0"
    };
    const { resources: migratedUsersResult } = await usersContainer.items.query(migratedUsersQuery).fetchAll();
    const migratedUsers = migratedUsersResult[0] || 0;

    return NextResponse.json({
      totalUsers,
      migratedUsers,
      pendingMigration: totalUsers - migratedUsers,
      migrationComplete: migratedUsers === totalUsers
    });

  } catch (error) {
    console.error('Error checking migration status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

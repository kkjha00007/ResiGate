// src/app/api/rbac/demo-users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, getUserById, logAuditAction, hashPassword } from '@/lib/server-utils';
import { getUsersContainer } from '@/lib/cosmosdb';
import { LOGIN_ELIGIBLE_ROLES, ROLE_TO_GROUP } from '@/lib/constants';
import type { User, UserRoleAssociation } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface DemoUserTemplate {
  role: string;
  name: string;
  email: string;
  password: string;
  flatNumber?: string;
}

/**
 * Create demo users for all RBAC roles
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { societyId, societyName } = body;

    if (!societyId) {
      return NextResponse.json({ message: 'Society ID is required' }, { status: 400 });
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

    // Check if current user has permission to create demo users
    const canCreateDemoUsers = currentUser.roleAssociations?.some((association: UserRoleAssociation) => 
      association.isActive && ['owner_app'].includes(association.role)
    ) || ['owner_app', 'superadmin'].includes(currentUser.primaryRole);

    if (!canCreateDemoUsers) {
      return NextResponse.json({ message: 'Insufficient permissions to create demo users' }, { status: 403 });
    }

    const usersContainer = await getUsersContainer();
    
    // Define demo user templates for each role
    const demoUserTemplates: DemoUserTemplate[] = [
      // Governance Group
      {
        role: 'society_admin',
        name: 'Demo Society Admin',
        email: `society.admin@${societyName?.toLowerCase().replace(/\s+/g, '') || 'demo'}.com`,
        password: 'DemoPass123!',
        flatNumber: 'A-101'
      },
      
      // Staff Group
      {
        role: 'platform_admin',
        name: 'Demo Platform Admin',
        email: `platform.admin@${societyName?.toLowerCase().replace(/\s+/g, '') || 'demo'}.com`,
        password: 'DemoPass123!'
      },
      {
        role: 'support',
        name: 'Demo Support Staff',
        email: `support@${societyName?.toLowerCase().replace(/\s+/g, '') || 'demo'}.com`,
        password: 'DemoPass123!'
      },
      
      // Resident Group
      {
        role: 'resident',
        name: 'Demo Resident Owner',
        email: `owner@${societyName?.toLowerCase().replace(/\s+/g, '') || 'demo'}.com`,
        password: 'DemoPass123!',
        flatNumber: 'B-205'
      },
      {
        role: 'resident',
        name: 'Demo Resident Renter',
        email: `renter@${societyName?.toLowerCase().replace(/\s+/g, '') || 'demo'}.com`,
        password: 'DemoPass123!',
        flatNumber: 'C-301'
      }
    ];

    const createdUsers: string[] = [];
    const errors: string[] = [];

    for (const template of demoUserTemplates) {
      try {
        // Check if user already exists
        const existingUserQuery = {
          query: "SELECT * FROM c WHERE c.email = @email",
          parameters: [{ name: "@email", value: template.email }]
        };
        
        const { resources: existingUsers } = await usersContainer.items.query<User>(existingUserQuery).fetchAll();
        
        if (existingUsers.length > 0) {
          errors.push(`User with email ${template.email} already exists`);
          continue;
        }

        // Hash password
        const hashedPassword = await hashPassword(template.password);

        // Create role association
        const roleAssociation: UserRoleAssociation = {
          id: uuidv4(),
          userId: '', // Will be set after user creation
          role: template.role as any,
          societyId: societyId,
          flatNumber: template.flatNumber,
          isActive: true,
          assignedAt: new Date().toISOString(),
          assignedBy: currentUser.id
        };

        // Create user
        const newUser: User = {
          id: uuidv4(),
          email: template.email,
          password: hashedPassword,
          name: template.name,
          primaryRole: template.role as any,
          roleAssociations: [{ ...roleAssociation, userId: '' }], // Will update userId
          societyId: societyId,
          flatNumber: template.flatNumber,
          isApproved: true,
          registrationDate: new Date().toISOString(),
          themePreference: 'light'
        };

        // Set the userId in role association
        newUser.roleAssociations[0].userId = newUser.id;

        // Create user in database
        await usersContainer.items.create(newUser);
        createdUsers.push(newUser.email);

        // Log user creation
        await logAuditAction({
          societyId: societyId,
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.primaryRole,
          action: 'CREATE_DEMO_USER',
          targetType: 'User',
          targetId: newUser.id,
          details: { 
            demoUserEmail: newUser.email,
            demoUserRole: template.role,
            demoUserName: newUser.name
          }
        });

      } catch (error) {
        console.error(`Error creating demo user ${template.email}:`, error);
        errors.push(`Failed to create ${template.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({ 
      message: 'Demo user creation completed',
      createdUsers,
      createdCount: createdUsers.length,
      errorCount: errors.length,
      errors: errors.slice(0, 5), // Limit errors shown
      loginCredentials: demoUserTemplates.map(template => ({
        role: template.role,
        email: template.email,
        password: template.password,
        name: template.name
      }))
    });

  } catch (error) {
    console.error('Error creating demo users:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Get demo user information
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
    const canViewDemoUsers = currentUser.roleAssociations?.some((association: UserRoleAssociation) => 
      association.isActive && ['owner_app'].includes(association.role)
    ) || ['owner_app', 'superadmin'].includes(currentUser.primaryRole);

    if (!canViewDemoUsers) {
      return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 });
    }

    return NextResponse.json({
      loginEligibleRoles: LOGIN_ELIGIBLE_ROLES,
      roleGroups: Object.entries(ROLE_TO_GROUP).reduce((acc, [role, group]) => {
        if (!acc[group]) acc[group] = [];
        acc[group].push(role);
        return acc;
      }, {} as { [group: string]: string[] }),
      instructions: {
        society_admin: 'Full access to society management features',
        platform_admin: 'Platform-wide administrative access',
        support: 'Support and helpdesk capabilities', 
        resident: 'Standard resident features and access'
      }
    });

  } catch (error) {
    console.error('Error getting demo user info:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

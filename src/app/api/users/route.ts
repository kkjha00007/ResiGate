// src/app/api/users/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getUsersContainer, getSocietySettingsContainer } from '@/lib/cosmosdb';
import type { User, UserRole, SocietyInfoSettings, UserRoleAssociation } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { USER_ROLES, SELECTABLE_USER_ROLES, DEFAULT_ROLE_PERMISSIONS, LOGIN_ELIGIBLE_ROLES } from '@/lib/constants';
import bcrypt from 'bcryptjs';
import { CosmosClient } from '@azure/cosmos';
import { createNotification } from '@/lib/notifications';

const SALT_ROUNDS = 10;

// Get all users (potentially for admin) - Requires societyId
export async function GET(request: NextRequest) {
  const usersContainer = await getUsersContainer();
  const societyId = request.nextUrl.searchParams.get('societyId');
  if (!societyId) {
    return NextResponse.json({ message: 'Society ID is required for fetching users.' }, { status: 400 });
  }
  const isApprovedParam = request.nextUrl.searchParams.get('isApproved');
  let query = "SELECT * FROM c WHERE c.societyId = @societyId";
  const parameters: any[] = [{ name: "@societyId", value: societyId }];
  if (isApprovedParam === 'true' || isApprovedParam === 'false') {
    query += " AND c.isApproved = @isApproved";
    parameters.push({ name: "@isApproved", value: isApprovedParam === 'true' });
  }
  try {
    const querySpec = {
      query,
      parameters
    };
    const { resources: userItems } = await usersContainer.items.query<User>(querySpec, { partitionKey: societyId }).fetchAll();
    const users = userItems.map((u: User) => {
      const { password, ...userProfile } = u;
      return userProfile;
    });
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Get Users API error:', error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: `Failed to retrieve user list from database. Detail: ${detail}` }, { status: 500 });
  }
}

// Register (create) a new user
export async function POST(request: NextRequest) {
  const usersContainer = await getUsersContainer();
  try {
    // Accept new RBAC structure or legacy for backward compatibility
    const userData = await request.json() as {
      email: string;
      password: string;
      name: string;
      flatNumber: string;
      societyId: string;
      primaryRole?: UserRole;
      roleAssociations?: Array<{role: UserRole; societyId: string; permissions: Record<string, any>}>;
      // Legacy support
      role?: string;
    };
    
    const { email, password: plainTextPassword, name, flatNumber, societyId, primaryRole, roleAssociations, role } = userData;

    // Step 1: Basic validation
    if (!email || !plainTextPassword || !name || !flatNumber || !societyId) {
      return NextResponse.json({ message: 'Missing required fields: email, password, name, flatNumber, societyId.' }, { status: 400 });
    }

    // Determine the primary role - either from new structure or legacy
    let userPrimaryRole: UserRole;
    if (primaryRole) {
      userPrimaryRole = primaryRole;
    } else if (role) {
      // Legacy role mapping
      const legacyRoleMapping: Record<string, UserRole> = {
        'owner': 'owner_resident',
        'renter': 'renter_resident',
        'guard': 'guard'
      };
      userPrimaryRole = legacyRoleMapping[role] || role as UserRole;
    } else {
      return NextResponse.json({ message: 'Role information is required.' }, { status: 400 });
    }

    // Validate role exists in LOGIN_ELIGIBLE_ROLES
    if (!LOGIN_ELIGIBLE_ROLES.includes(userPrimaryRole as any)) {
      return NextResponse.json({ message: 'Invalid role selected' }, { status: 400 });
    }

    // Role-specific flat number validation
    if (userPrimaryRole === USER_ROLES.GUARD && flatNumber.toUpperCase() !== 'NA') {
      return NextResponse.json({ message: "Flat number must be 'NA' for Guard role." }, { status: 400 });
    }
    if (['owner_resident', 'renter_resident'].includes(userPrimaryRole) && (flatNumber.toUpperCase() === 'NA' || !flatNumber)) {
      return NextResponse.json({ message: "Flat number is required for Owner/Renter and cannot be 'NA'." }, { status: 400 });
    }

    // Step 2: Check for existing user (email uniqueness globally for now)
    let existingUsers: User[] = [];
    try {
      const querySpecEmailCheck = {
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: email }]
      };
      // Cross-partition query for email uniqueness
      const { resources } = await usersContainer.items.query<User>(querySpecEmailCheck).fetchAll();
      existingUsers = resources;
    } catch (dbError: any) {
      console.error('Error querying existing users:', dbError);
      return NextResponse.json({ message: 'Database error checking existing user.', error: dbError.message || String(dbError) }, { status: 500 });
    }

    if (existingUsers.length > 0) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
    }
    
    // Step 3: Hash password
    let hashedPassword = '';
    try {
      hashedPassword = await bcrypt.hash(plainTextPassword, SALT_ROUNDS);
    } catch (hashError: any) {
      console.error('Error hashing password:', hashError);
      return NextResponse.json({ message: 'Error processing registration (hashing).', error: hashError.message || String(hashError) }, { status: 500 });
    }

    // Step 4: Create new user object
    const userId = uuidv4();
    
    const userRoleAssociations: UserRoleAssociation[] = roleAssociations ? roleAssociations.map(ra => ({
      id: uuidv4(),
      userId,
      role: ra.role,
      societyId: ra.societyId,
      flatNumber,
      permissions: ra.permissions,
      isActive: true,
      assignedAt: new Date().toISOString(),
      assignedBy: 'system' // System assignment for new registrations
    })) : [{
      id: uuidv4(),
      userId,
      role: userPrimaryRole,
      societyId,
      flatNumber,
      customPermissions: (DEFAULT_ROLE_PERMISSIONS as any)[userPrimaryRole] ? {} : undefined,
      isActive: true,
      assignedAt: new Date().toISOString(),
      assignedBy: 'system' // System assignment for new registrations
    }];

    const newUser: User = {
      id: userId,
      societyId,
      name,
      email,
      password: hashedPassword,
      flatNumber,
      primaryRole: userPrimaryRole,
      roleAssociations: userRoleAssociations,
      isApproved: false, 
      registrationDate: new Date().toISOString(),
    };

    // Step 5: Create user in DB
    let createdUser: User | undefined;
    try {
      const { resource } = await usersContainer.items.create(newUser);
      createdUser = resource;
      if (!createdUser) {
        console.error('User creation in DB returned undefined resource without throwing error.');
        return NextResponse.json({ message: 'Failed to create user record (unexpected DB response).' }, { status: 500 });
      }
      // --- Notify all society admins in this society ---
      // Find all admins for this society using the new role structure
      const adminQuery = {
        query: "SELECT * FROM c WHERE c.societyId = @societyId AND c.primaryRole = @societyAdmin",
        parameters: [
          { name: "@societyId", value: societyId },
          { name: "@societyAdmin", value: USER_ROLES.SOCIETY_ADMIN }
        ]
      };
      const { resources: admins } = await usersContainer.items.query<User>(adminQuery, { partitionKey: societyId }).fetchAll();
      
      // Also notify platform admins (Owner App and Ops)
      const platformAdminQuery = {
        query: "SELECT * FROM c WHERE c.primaryRole = @ownerApp OR c.primaryRole = @ops",
        parameters: [
          { name: "@ownerApp", value: USER_ROLES.OWNER_APP },
          { name: "@ops", value: USER_ROLES.OPS }
        ]
      };
      const { resources: platformAdmins } = await usersContainer.items.query<User>(platformAdminQuery).fetchAll();
      const allAdmins = [...admins, ...platformAdmins];
      await Promise.all(
        allAdmins.map(admin =>
          createNotification({
            userId: admin.id,
            type: 'registration',
            title: 'New User Registration',
            message: `${createdUser!.name} has registered and is awaiting approval.`,
            link: '/dashboard/admin/admin-approvals',
          })
        )
      );
    } catch (dbCreateError: any) {
      console.error('Error creating user in DB:', dbCreateError);
      return NextResponse.json({ message: 'Database error creating user.', error: dbCreateError.message || String(dbCreateError) }, { status: 500 });
    }
    
    // Step 6: Check/Create SocietyInfoSettings for the new societyId (optional, only if not exists)
    const societySettingsContainer = getSocietySettingsContainer();
    try {
        await societySettingsContainer.item(societyId, societyId).read();
    } catch (error: any) {
        if ((error as any).code === 404 || (error as any).code === 'NotFound' || (error as any).statusCode === 404) {
            const defaultSocietyInfo: SocietyInfoSettings = {
                id: societyId, 
                societyId: societyId,
                societyName: '', // Not provided here, can be set later
                registrationNumber: '', address: '', contactEmail: '', contactPhone: '',
                updatedAt: new Date().toISOString(),
            };
            try {
              await societySettingsContainer.items.create(defaultSocietyInfo);
              console.log(`Created default SocietyInfoSettings for new society: ${societyId}`);
            } catch (settingsCreateError: any) {
              console.error(`Error creating SocietyInfoSettings for society ${societyId}:`, settingsCreateError);
            }
        } else {
            console.error(`Error checking/creating SocietyInfoSettings for society ${societyId}:`, error);
        }
    }
    
    const { password, ...userProfile } = createdUser;
    return NextResponse.json(userProfile, { status: 201 });
  } catch (error: any) {
    console.error('Register User API error (Outer Catch):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during registration.';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

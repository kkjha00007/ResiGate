
// src/app/api/users/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { usersContainer, societySettingsContainer } from '@/lib/cosmosdb';
import type { User, UserRole, SocietyInfoSettings } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { USER_ROLES, SELECTABLE_USER_ROLES } from '@/lib/constants'; // Ensure USER_ROLES is imported
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// Get all users (potentially for admin) - Requires tenantId
export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ message: 'Tenant ID is required for fetching users.' }, { status: 400 });
  }
  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.tenantId = @tenantId",
      parameters: [{ name: "@tenantId", value: tenantId }]
    };
    // For composite key, provide an array for partitionKey if needed by specific SDK versions or configurations,
    // though often the SDK infers from the query if tenantId is the first part of the composite key.
    // For /tenantId as the first key, this should work.
    const { resources: userItems } = await usersContainer.items.query<User>(querySpec, { partitionKey: tenantId }).fetchAll();
    
    const users = userItems.map(u => {
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
  try {
    const userData = await request.json() as Omit<User, 'id' | 'isApproved' | 'registrationDate' | 'password' | 'tenantId'> & {password: string, role: Exclude<UserRole, "superadmin">, societyName: string};
    const { email, password: plainTextPassword, name, flatNumber, role, societyName } = userData;

    // Step 1: Basic validation
    if (!email || !plainTextPassword || !name || !flatNumber || !role || !societyName) {
      return NextResponse.json({ message: 'Missing required fields: email, password, name, flatNumber, role, societyName.' }, { status: 400 });
    }
    if (!SELECTABLE_USER_ROLES.includes(role)) {
        return NextResponse.json({ message: 'Invalid role selected' }, { status: 400 });
    }
    if (role === USER_ROLES.GUARD && flatNumber.toUpperCase() !== 'NA') {
      return NextResponse.json({ message: "Flat number must be 'NA' for Guard role." }, { status: 400 });
    }
    if ((role === USER_ROLES.OWNER || role === USER_ROLES.RENTER) && (flatNumber.toUpperCase() === 'NA' || !flatNumber)) {
      return NextResponse.json({ message: "Flat number is required for Owner/Renter and cannot be 'NA'." }, { status: 400 });
    }

    // Step 2: Derive tenantId
    const tenantId = societyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!tenantId) {
      console.error('Tenant ID derivation resulted in an empty string for societyName:', societyName);
      return NextResponse.json({ message: 'Invalid society name, could not derive a valid Tenant ID. Please use alphanumeric characters and spaces.' }, { status: 400 });
    }

    // Step 3: Check for existing user (email uniqueness globally for now)
    let existingUsers: User[] = [];
    try {
      const querySpecEmailCheck = {
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: email }]
      };
      // This query might need enableCrossPartitionQuery if not partitioned by email,
      // or if you intend email to be unique only per tenant, add c.tenantId = @tenantId to the query.
      const { resources } = await usersContainer.items.query<User>(querySpecEmailCheck, {enableCrossPartitionQuery: true}).fetchAll();
      existingUsers = resources;
    } catch (dbError: any) {
      console.error('Error querying existing users:', dbError);
      return NextResponse.json({ message: 'Database error checking existing user.', error: dbError.message || String(dbError) }, { status: 500 });
    }

    if (existingUsers.length > 0) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
    }
    
    // Step 4: Hash password
    let hashedPassword = '';
    try {
      hashedPassword = await bcrypt.hash(plainTextPassword, SALT_ROUNDS);
    } catch (hashError: any) {
      console.error('Error hashing password:', hashError);
      return NextResponse.json({ message: 'Error processing registration (hashing).', error: hashError.message || String(hashError) }, { status: 500 });
    }

    // Step 5: Create new user object
    const newUser: User = {
      id: uuidv4(),
      tenantId,
      name,
      email,
      password: hashedPassword,
      flatNumber,
      role, // Role comes from client
      isApproved: false, 
      registrationDate: new Date().toISOString(),
    };

    // Step 6: Create user in DB
    let createdUser: User | undefined;
    try {
      // For composite key ["/tenantId", "/role"], the SDK handles it if these fields are in `newUser`
      const { resource } = await usersContainer.items.create(newUser);
      createdUser = resource;
      if (!createdUser) {
        console.error('User creation in DB returned undefined resource without throwing error.');
        return NextResponse.json({ message: 'Failed to create user record (unexpected DB response).' }, { status: 500 });
      }
    } catch (dbCreateError: any) {
      console.error('Error creating user in DB:', dbCreateError);
      return NextResponse.json({ message: 'Database error creating user.', error: dbCreateError.message || String(dbCreateError) }, { status: 500 });
    }
    
    // Step 7: Check/Create SocietyInfoSettings for the new tenant
    try {
        // Read item with partition key for SocietySettings (which is /id, and we use tenantId as id)
        await societySettingsContainer.item(tenantId, tenantId).read();
    } catch (error: any) {
        if ((error as any).code === 404 || (error as any).code === 'NotFound' || (error as any).statusCode === 404) {
            const defaultSocietyInfo: SocietyInfoSettings = {
                id: tenantId, 
                tenantId: tenantId,
                societyName: societyName, 
                registrationNumber: '', address: '', contactEmail: '', contactPhone: '',
                updatedAt: new Date().toISOString(),
            };
            try {
              await societySettingsContainer.items.create(defaultSocietyInfo);
              console.log(`Created default SocietyInfoSettings for new tenant: ${tenantId}`);
            } catch (settingsCreateError: any) {
              console.error(`Error creating SocietyInfoSettings for tenant ${tenantId}:`, settingsCreateError);
              // Don't fail user registration for this, but log it as a significant issue.
            }
        } else {
            console.error(`Error checking/creating SocietyInfoSettings for tenant ${tenantId}:`, error);
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

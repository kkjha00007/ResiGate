
// src/app/api/users/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { usersContainer, societySettingsContainer } from '@/lib/cosmosdb';
import type { User, UserRole, SocietyInfoSettings } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { USER_ROLES, SELECTABLE_USER_ROLES } from '@/lib/constants';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// Get all users (potentially for admin) - Requires tenantId
export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ message: 'Tenant ID is required for fetching users.' }, { status: 400 });
  }
  try {
    // For composite partition key ["/tenantId", "/role"], query needs tenantId.
    // To get ALL users for a tenant, you'd typically query with tenantId and allow cross-partition if roles are diverse,
    // or iterate through roles if that's more efficient for your specific Cosmos DB setup.
    // For simplicity, if just querying with tenantId, ensure your query is structured for it.
    // A simple query might be: "SELECT * FROM c WHERE c.tenantId = @tenantId"
    // However, if your /users endpoint is intended for superadmins to see all users across tenants,
    // then the query must not filter by tenantId, and needs appropriate indexing/cross-partition settings.
    // Given the context, this GET route is likely for admin viewing users within *their* tenant.
    const querySpec = {
      query: "SELECT * FROM c WHERE c.tenantId = @tenantId",
      parameters: [{ name: "@tenantId", value: tenantId }]
    };
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
      return NextResponse.json({ message: 'Invalid society name, could not derive Tenant ID.' }, { status: 400 });
    }

    // Step 3: Check for existing user (email uniqueness globally for now)
    let existingUsers: User[] = [];
    try {
      const querySpecEmailCheck = {
        query: "SELECT * FROM c WHERE c.email = @email", // Consider adding c.tenantId = @tenantId if emails are unique per tenant
        parameters: [{ name: "@email", value: email }]
      };
      const { resources } = await usersContainer.items.query<User>(querySpecEmailCheck).fetchAll(); // May need enableCrossPartitionQuery if not partitioned by email
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
      role,
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
        // Read item with partition key for SocietySettings (which is /tenantId, so effectively /id)
        await societySettingsContainer.item(tenantId, tenantId).read();
    } catch (error: any) {
        // If item not found, create it. Cosmos SDK throws error for 404.
        // Check for specific "NotFound" or status code 404 if possible, otherwise assume not found
        if ((error as any).code === 404 || (error as any).code === 'NotFound' || (error as any).statusCode === 404) {
            const defaultSocietyInfo: SocietyInfoSettings = {
                id: tenantId, 
                tenantId: tenantId, // Explicitly add tenantId for clarity if schema expects it
                societyName: societyName, 
                registrationNumber: '', address: '', contactEmail: '', contactPhone: '',
                updatedAt: new Date().toISOString(),
            };
            try {
              // When creating, provide the item and partition key if different or composite
              // For /id partition key, id is used as partition key value implicitly
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

  } catch (error: any) { // General catch-all for unexpected errors in the overall flow
    console.error('Register User API error (Outer Catch):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during registration.';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

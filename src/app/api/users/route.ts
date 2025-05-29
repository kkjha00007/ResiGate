// src/app/api/users/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { usersContainer, societySettingsContainer } from '@/lib/cosmosdb';
import type { User, UserRole, SocietyInfoSettings } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { USER_ROLES, SELECTABLE_USER_ROLES } from '@/lib/constants'; // Ensure USER_ROLES is imported
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// Get all users (potentially for admin) - Requires societyId
export async function GET(request: NextRequest) {
  // Accept societyId (not tenantId)
  const societyId = request.nextUrl.searchParams.get('societyId');
  if (!societyId) {
    return NextResponse.json({ message: 'Society ID is required for fetching users.' }, { status: 400 });
  }
  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.societyId = @societyId",
      parameters: [{ name: "@societyId", value: societyId }]
    };
    const { resources: userItems } = await usersContainer.items.query<User>(querySpec, { partitionKey: societyId }).fetchAll();
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
    // Accept societyId instead of societyName/tenantId
    const userData = await request.json() as Omit<User, 'id' | 'isApproved' | 'registrationDate' | 'password'> & {password: string, role: (typeof SELECTABLE_USER_ROLES)[number], societyId: string};
    const { email, password: plainTextPassword, name, flatNumber, role, societyId } = userData;

    // Step 1: Basic validation
    if (!email || !plainTextPassword || !name || !flatNumber || !role || !societyId) {
      return NextResponse.json({ message: 'Missing required fields: email, password, name, flatNumber, role, societyId.' }, { status: 400 });
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

    // Step 2: Check for existing user (email uniqueness globally for now)
    let existingUsers: User[] = [];
    try {
      const querySpecEmailCheck = {
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: email }]
      };
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
    const newUser: User = {
      id: uuidv4(),
      societyId,
      name,
      email,
      password: hashedPassword,
      flatNumber,
      role, // Role comes from client
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
    } catch (dbCreateError: any) {
      console.error('Error creating user in DB:', dbCreateError);
      return NextResponse.json({ message: 'Database error creating user.', error: dbCreateError.message || String(dbCreateError) }, { status: 500 });
    }
    
    // Step 6: Check/Create SocietyInfoSettings for the new societyId (optional, only if not exists)
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

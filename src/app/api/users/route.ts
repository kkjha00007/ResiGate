
// src/app/api/users/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { usersContainer, societySettingsContainer } from '@/lib/cosmosdb'; // Added societySettingsContainer
import type { User, UserRole, SocietyInfoSettings } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { USER_ROLES, SELECTABLE_USER_ROLES } from '@/lib/constants';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10; // Cost factor for bcrypt hashing

// Get all users (potentially for admin)
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
    const { resources: userItems } = await usersContainer.items.query<User>(querySpec).fetchAll();
    
    // Remove passwords before sending
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

    if (!email || !plainTextPassword || !name || !flatNumber || !role || !societyName) {
      return NextResponse.json({ message: 'Missing required fields for registration, including society name.' }, { status: 400 });
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

    // Derive tenantId from societyName
    const tenantId = societyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!tenantId) {
      return NextResponse.json({ message: 'Invalid society name, could not derive Tenant ID.' }, { status: 400 });
    }

    // Check if user email already exists (globally or per tenant - currently global)
    const querySpecEmailCheck = {
      query: "SELECT * FROM c WHERE c.email = @email", // Consider c.tenantId = @tenantId AND c.email = @email for per-tenant email uniqueness
      parameters: [{ name: "@email", value: email } /*, { name: "@tenantId", value: tenantId } */]
    };
    const { resources: existingUsers } = await usersContainer.items.query<User>(querySpecEmailCheck).fetchAll();

    if (existingUsers.length > 0) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
    }
    
    const isApprovedInitially = false; // All new registrations require admin approval

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(plainTextPassword, SALT_ROUNDS);

    const newUser: User = {
      id: uuidv4(),
      tenantId,
      name,
      email,
      password: hashedPassword,
      flatNumber,
      role,
      isApproved: isApprovedInitially,
      registrationDate: new Date().toISOString(),
    };

    const { resource: createdUser } = await usersContainer.items.create(newUser);

    if (!createdUser) {
        return NextResponse.json({ message: 'Failed to create user' }, { status: 500 });
    }

    // Check if SocietyInfoSettings document exists for this tenantId, if not, create a default one
    try {
        await societySettingsContainer.item(tenantId, tenantId).read();
    } catch (error: any) {
        if (error.code === 404) { // Not found
            const defaultSocietyInfo: SocietyInfoSettings = {
                id: tenantId, // Using tenantId as the id for the SocietyInfoSettings document
                tenantId: tenantId,
                societyName: societyName, // Use the provided society name
                registrationNumber: '',
                address: '',
                contactEmail: '',
                contactPhone: '',
                updatedAt: new Date().toISOString(),
            };
            await societySettingsContainer.items.create(defaultSocietyInfo);
            console.log(`Created default SocietyInfoSettings for new tenant: ${tenantId}`);
        } else {
            // Log other errors but don't fail user registration
            console.error(`Error checking/creating SocietyInfoSettings for tenant ${tenantId}:`, error);
        }
    }
    
    const { password, ...userProfile } = createdUser;

    return NextResponse.json(userProfile, { status: 201 });

  } catch (error) {
    console.error('Register User API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during registration.';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

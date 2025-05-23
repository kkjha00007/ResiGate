
// src/app/api/users/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { usersContainer } from '@/lib/cosmosdb';
import type { User, UserRole } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { USER_ROLES, SELECTABLE_USER_ROLES } from '@/lib/constants';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10; // Cost factor for bcrypt hashing

// Get all users (potentially for admin)
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication and authorization (e.g., only admin can access this)
    const { resources: userItems } = await usersContainer.items.readAll<User>().fetchAll();
    
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
    const userData = await request.json() as Omit<User, 'id' | 'isApproved' | 'registrationDate'> & {password: string, role: Exclude<UserRole, "superadmin">};

    if (!userData.email || !userData.password || !userData.name || !userData.flatNumber || !userData.role) {
      return NextResponse.json({ message: 'Missing required fields for registration' }, { status: 400 });
    }

    if (!SELECTABLE_USER_ROLES.includes(userData.role)) {
        return NextResponse.json({ message: 'Invalid role selected' }, { status: 400 });
    }
    
    if (userData.role === USER_ROLES.GUARD && userData.flatNumber.toUpperCase() !== 'NA') {
      return NextResponse.json({ message: "Flat number must be 'NA' for Guard role." }, { status: 400 });
    }
    if ((userData.role === USER_ROLES.OWNER || userData.role === USER_ROLES.RENTER) && (userData.flatNumber.toUpperCase() === 'NA' || !userData.flatNumber)) {
      return NextResponse.json({ message: "Flat number is required for Owner/Renter and cannot be 'NA'." }, { status: 400 });
    }


    // Check if user already exists
    const querySpecEmailCheck = {
      query: "SELECT * FROM c WHERE c.email = @email",
      parameters: [{ name: "@email", value: userData.email }]
    };
    const { resources: existingUsers } = await usersContainer.items.query<User>(querySpecEmailCheck).fetchAll();

    if (existingUsers.length > 0) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
    }
    
    // All new registrations (Owner, Renter, Guard) require admin approval.
    const isApprovedInitially = false;

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

    const newUser: User = {
      id: uuidv4(),
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      flatNumber: userData.flatNumber,
      role: userData.role, // Role from request
      isApproved: isApprovedInitially,
      registrationDate: new Date().toISOString(),
    };

    const { resource: createdUser } = await usersContainer.items.create(newUser);

    if (!createdUser) {
        return NextResponse.json({ message: 'Failed to create user' }, { status: 500 });
    }
    
    const { password, ...userProfile } = createdUser;

    return NextResponse.json(userProfile, { status: 201 });

  } catch (error) {
    console.error('Register User API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during registration.';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

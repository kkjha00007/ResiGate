
// src/app/api/users/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { usersContainer } from '@/lib/cosmosdb';
import type { User } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { USER_ROLES } from '@/lib/constants';
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
    // Return a more specific error message to the client
    return NextResponse.json({ message: `Failed to retrieve user list from database. Detail: ${detail}` }, { status: 500 });
  }
}

// Register (create) a new user
export async function POST(request: NextRequest) {
  try {
    const userData = await request.json() as Omit<User, 'id' | 'isApproved' | 'role' | 'registrationDate'> & {password: string, flatNumber: string};

    if (!userData.email || !userData.password || !userData.name || !userData.flatNumber) {
      return NextResponse.json({ message: 'Missing required fields for registration' }, { status: 400 });
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
    
    // Standard registration: new users are residents and not approved by default.
    const roleToAssign = USER_ROLES.RESIDENT;
    const isApprovedInitially = false;

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

    const newUser: User = {
      id: uuidv4(), // Generate a unique ID
      name: userData.name,
      email: userData.email,
      password: hashedPassword, // Store the hashed password
      flatNumber: userData.flatNumber,
      role: roleToAssign,
      isApproved: isApprovedInitially,
      registrationDate: new Date().toISOString(),
    };

    const { resource: createdUser } = await usersContainer.items.create(newUser);

    if (!createdUser) {
        return NextResponse.json({ message: 'Failed to create user' }, { status: 500 });
    }
    
    // IMPORTANT: Remove password before sending user data to client
    const { password, ...userProfile } = createdUser;

    return NextResponse.json(userProfile, { status: 201 });

  } catch (error) {
    console.error('Register User API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during registration.';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

// src/app/api/auth/login/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { usersContainer } from '@/lib/cosmosdb';
import type { User } from '@/lib/types';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password: plainTextPassword } = await request.json();

    if (!email || !plainTextPassword) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Query Cosmos DB for the user by email
    const querySpec = {
      query: "SELECT * FROM c WHERE c.email = @email",
      parameters: [
        { name: "@email", value: email }
      ]
    };

    const { resources: foundUsers } = await usersContainer.items.query<User>(querySpec).fetchAll();

    if (foundUsers.length === 0) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const user = foundUsers[0];

    // User found, now compare the provided password with the stored hashed password
    // Ensure user.password (the hash) exists
    if (!user.password) {
        console.error(`User ${email} found but has no password hash stored.`);
        return NextResponse.json({ message: 'Authentication error' }, { status: 500 });
    }

    const isPasswordMatch = await bcrypt.compare(plainTextPassword, user.password);

    if (!isPasswordMatch) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // Password matches
    // IMPORTANT: Remove password hash before sending user data to client
    const { password: _, ...userProfile } = user;

    return NextResponse.json(userProfile, { status: 200 });

  } catch (error) {
    console.error('Login API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

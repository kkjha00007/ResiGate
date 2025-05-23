// src/app/api/auth/login/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { usersContainer } from '@/lib/cosmosdb';
import type { User } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Query Cosmos DB for the user
    // IMPORTANT: In a real app, you would query by email and then securely compare a HASHED password.
    // Here, we are comparing plain text passwords, which is NOT secure for production.
    const querySpec = {
      query: "SELECT * FROM c WHERE c.email = @email AND c.password = @password", // UNSAFE: PLAIN TEXT PASSWORD
      parameters: [
        { name: "@email", value: email },
        { name: "@password", value: password } // UNSAFE
      ]
    };

    const { resources: foundUsers } = await usersContainer.items.query<User>(querySpec).fetchAll();

    if (foundUsers.length === 0) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const user = foundUsers[0];

    // IMPORTANT: Remove password before sending user data to client
    const { password: _, ...userProfile } = user;

    return NextResponse.json(userProfile, { status: 200 });

  } catch (error) {
    console.error('Login API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

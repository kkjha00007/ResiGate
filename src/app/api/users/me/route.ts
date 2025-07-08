// src/app/api/users/me/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getUsersContainer } from '@/lib/cosmosdb';
import { getApiSessionUser } from '@/lib/api-session-user';
import type { User } from '@/lib/types';

// Get the current authenticated user
export async function GET(request: NextRequest) {
  try {
    // Get user from session or token
    const sessionUser = await getApiSessionUser(request);
    if (!sessionUser || !sessionUser.id) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const usersContainer = await getUsersContainer();
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.id = @userId',
      parameters: [{ name: '@userId', value: sessionUser.id }],
    };
    const { resources: foundUsers } = await usersContainer.items.query<User>(querySpec).fetchAll();
    if (foundUsers.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    const user = foundUsers[0];
    const { password, ...userProfile } = user;
    return NextResponse.json(userProfile, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Get Current User (me) API error:', error);
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

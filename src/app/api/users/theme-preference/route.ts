// src/app/api/users/theme-preference/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getUsersContainer } from '@/lib/cosmosdb';
import type { User } from '@/lib/types';

// PATCH: Update theme preference for logged-in user
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const societyId = request.headers.get('x-society-id');
  if (!userId || !societyId) {
    return NextResponse.json({ message: 'User ID and society ID required.' }, { status: 400 });
  }
  let usersContainer;
  try {
    usersContainer = await getUsersContainer();
  } catch (err) {
    return NextResponse.json({ message: 'Cosmos DB connection is not configured.' }, { status: 500 });
  }
  try {
    const { themePreference } = await request.json();
    if (themePreference !== 'light' && themePreference !== 'dark') {
      return NextResponse.json({ message: 'Invalid theme preference.' }, { status: 400 });
    }
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.id = @userId',
      parameters: [{ name: '@userId', value: userId }],
    };
    const { resources } = await usersContainer.items.query<User>(querySpec, { partitionKey: societyId }).fetchAll();
    if (!resources.length) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }
    const user = resources[0];
    const updatedUser: User = { ...user, themePreference };
    const { resource: replacedUser } = await usersContainer.item(userId, societyId).replace(updatedUser);
    if (!replacedUser) {
      return NextResponse.json({ message: 'Failed to update theme preference.' }, { status: 500 });
    }
    return NextResponse.json({ themePreference: replacedUser.themePreference }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error', error: String(error) }, { status: 500 });
  }
}

// GET: Get theme preference for logged-in user
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const societyId = request.headers.get('x-society-id');
  if (!userId || !societyId) {
    return NextResponse.json({ message: 'User ID and society ID required.' }, { status: 400 });
  }
  let usersContainer;
  try {
    usersContainer = await getUsersContainer();
  } catch (err) {
    return NextResponse.json({ message: 'Cosmos DB connection is not configured.' }, { status: 500 });
  }
  try {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.id = @userId',
      parameters: [{ name: '@userId', value: userId }],
    };
    const { resources } = await usersContainer.items.query<User>(querySpec, { partitionKey: societyId }).fetchAll();
    if (!resources.length) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }
    return NextResponse.json({ themePreference: resources[0].themePreference || 'light' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error', error: String(error) }, { status: 500 });
  }
}

// src/app/api/users/[userId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { usersContainer } from '@/lib/cosmosdb';
import type { User } from '@/lib/types';

// Get a specific user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    // In Cosmos DB, if you use 'id' as the primary key, you can read directly.
    // However, partition key is also needed for direct read if it's not 'id'.
    // For this example, assuming 'id' is unique and we query.
    // If you know the partition key, direct read is more efficient:
    // const { resource: user } = await usersContainer.item(userId, PARTITION_KEY_VALUE_HERE).read<User>();

    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @userId",
      parameters: [{ name: "@userId", value: userId }]
    };
    const { resources: foundUsers } = await usersContainer.items.query<User>(querySpec).fetchAll();


    if (foundUsers.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    const user = foundUsers[0];
    // IMPORTANT: Remove password before sending user data to client
    const { password, ...userProfile } = user;

    return NextResponse.json(userProfile, { status: 200 });
  } catch (error) {
    console.error(`Get User ${params.userId} API error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


// Update a user (e.g., approve resident)
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const updates = await request.json() as Partial<User>;

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }
    
    // Fetch the existing user to get its partition key value if needed and to merge updates.
    // A more direct way:
    // const { resource: itemToUpdate } = await usersContainer.item(userId, PARTITION_KEY_FOR_USERID).read<User>();
    // if (!itemToUpdate) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    // const updatedItem = { ...itemToUpdate, ...updates };
    // const { resource: updatedUser } = await usersContainer.item(userId, PARTITION_KEY_FOR_USERID).replace(updatedItem);
    
    // For now, using a query to find and then update. This is less efficient than direct replace with partition key.
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @userId",
      parameters: [{ name: "@userId", value: userId }]
    };
    const { resources: foundUsers } = await usersContainer.items.query<User>(querySpec).fetchAll();

    if (foundUsers.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    const userToUpdate = foundUsers[0];

    // Merge updates, ensuring not to allow changing ID or critical fields unintentionally
    const updatedUserData: User = {
      ...userToUpdate,
      ...updates,
      id: userToUpdate.id, // Ensure ID remains the same
      email: userToUpdate.email, // সাধারণত ইমেইল পরিবর্তন করা উচিত না PUT এ, যদি না বিশেষ কোনো এন্ডপয়েন্ট থাকে
      role: userToUpdate.role, // ভূমিকা ও সাধারণত সরাসরি পরিবর্তন করা উচিত না
    };

    // If password is part of updates, it should be re-hashed.
    // For this example, we're directly setting it if provided.
    // delete updatedUserData.password; // Or handle password update specifically

    const { resource: replacedUser } = await usersContainer.item(userId, userToUpdate.role).replace(updatedUserData); // Assuming role is partition key

    if (!replacedUser) {
        return NextResponse.json({ message: 'Failed to update user' }, { status: 500 });
    }

    const { password, ...userProfile } = replacedUser;
    return NextResponse.json(userProfile, { status: 200 });

  } catch (error) {
    console.error(`Update User ${params.userId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

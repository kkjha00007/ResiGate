
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

    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @userId",
      parameters: [{ name: "@userId", value: userId }]
    };
    const { resources: foundUsers } = await usersContainer.items.query<User>(querySpec).fetchAll();


    if (foundUsers.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    const user = foundUsers[0];
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
    
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @userId",
      parameters: [{ name: "@userId", value: userId }]
    };
    const { resources: foundUsers } = await usersContainer.items.query<User>(querySpec).fetchAll();

    if (foundUsers.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    const userToUpdate = foundUsers[0];

    const updatedUserData: User = {
      ...userToUpdate,
      ...updates,
      id: userToUpdate.id, 
      email: userToUpdate.email, 
      // role: userToUpdate.role, // Role should generally not be changed via this generic PUT
    };

    // Do not allow password updates through this generic PUT endpoint
    // Password updates should have a dedicated, more secure mechanism if needed.
    if (updates.password) {
        delete updatedUserData.password;
    }
    
    // Ensure role is part of the updates if it's being changed, otherwise use existing
    // However, typically role changes might go through a more specific process.
    // For approval, we are primarily updating `isApproved`.
    const partitionKey = updatedUserData.role || userToUpdate.role;


    const { resource: replacedUser } = await usersContainer.item(userId, partitionKey).replace(updatedUserData); 

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

// Delete a user (e.g., reject registration)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    // To delete an item in Cosmos DB, you need its ID and its partition key value.
    // First, we need to fetch the user to find their role (which is the partition key).
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @userId",
      parameters: [{ name: "@userId", value: userId }]
    };
    const { resources: foundUsers } = await usersContainer.items.query<User>(querySpec).fetchAll();

    if (foundUsers.length === 0) {
      return NextResponse.json({ message: 'User not found to delete' }, { status: 404 });
    }
    const userToDelete = foundUsers[0];
    const userRoleForPartitionKey = userToDelete.role;

    // Now delete the item using its ID and partition key value
    const { resource: deletedUser } = await usersContainer.item(userId, userRoleForPartitionKey).delete();

    if (!deletedUser) {
        // This case might not be hit if the item is not found, as the query above would catch it.
        // However, if delete operation itself fails for other reasons.
        return NextResponse.json({ message: 'Failed to delete user' }, { status: 500 });
    }
    
    // Omit password from the returned deleted user profile for consistency
    const { password, ...userProfile } = userToDelete; 
    return NextResponse.json(userProfile, { status: 200 }); // Or return status 204 No Content

  } catch (error) {
    console.error(`Delete User ${params.userId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

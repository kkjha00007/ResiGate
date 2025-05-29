// src/app/api/users/[userId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getUsersContainer } from '@/lib/cosmosdb';
import type { User } from '@/lib/types';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// Get a specific user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const usersContainer = await getUsersContainer();
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


// Update a user (e.g., approve resident, update profile, change password)
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const usersContainer = await getUsersContainer();
    const userId = params.userId;
    const updates = await request.json() as Partial<User> & { currentPassword?: string, newPassword?: string };

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
    
    let userToUpdate = foundUsers[0];

    // Handle password change separately
    if (updates.currentPassword && updates.newPassword) {
      if (!userToUpdate.password) {
        return NextResponse.json({ message: 'Cannot change password for user without an existing password.' }, { status: 400 });
      }
      const isPasswordMatch = await bcrypt.compare(updates.currentPassword, userToUpdate.password);
      if (!isPasswordMatch) {
        return NextResponse.json({ message: 'Current password does not match.' }, { status: 400 });
      }
      const hashedNewPassword = await bcrypt.hash(updates.newPassword, SALT_ROUNDS);
      userToUpdate.password = hashedNewPassword;
      // Remove password fields from general updates to avoid conflicts
      delete updates.currentPassword;
      delete updates.newPassword;
    } else if (updates.currentPassword || updates.newPassword) {
      // If only one password field is sent, it's an invalid request for password change
      return NextResponse.json({ message: 'Both current and new password are required to change password.' }, { status: 400 });
    }

    // Apply other profile updates
    const updatedUserData: User = {
      ...userToUpdate,
      ...updates, // Apply general updates (name, secondary phones, isApproved)
      id: userToUpdate.id, 
      email: userToUpdate.email, // Email should not be changed here
      role: userToUpdate.role, // Role should not be changed here
    };
    
    // Ensure password is not accidentally overwritten by general updates if it wasn't a password change request
    if (!userToUpdate.password && updates.password) { // if userToUpdate had no password and updates tries to set one (other than through newPassword flow)
        delete updatedUserData.password;
    } else if (userToUpdate.password && !updates.newPassword) { // if userToUpdate had a password but this isn't a newPassword request
        updatedUserData.password = userToUpdate.password; // retain original hashed password
    }


    // Use correct partition key value (societyId) for replace
    const { resource: replacedUser } = await usersContainer.item(userId, userToUpdate.societyId).replace(updatedUserData); 

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
    const usersContainer = await getUsersContainer();
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
      return NextResponse.json({ message: 'User not found to delete' }, { status: 404 });
    }
    const userToDelete = foundUsers[0];
    // Use correct partition key value (societyId) for delete
    const userRoleForPartitionKey = userToDelete.societyId;
    const { resource: deletedUserResponse } = await usersContainer.item(userId, userRoleForPartitionKey).delete();
    
    // Cosmos DB delete operation returns a response, not necessarily the deleted item.
    // If status code is 204 (No Content), it's successful.
    // For the purpose of returning the userProfile, we use userToDelete found earlier.
    // The actual response 'deletedUserResponse' could be checked for status code if needed.

    const { password, ...userProfile } = userToDelete; 
    return NextResponse.json(userProfile, { status: 200 });

  } catch (error) {
    console.error(`Delete User ${params.userId} API error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

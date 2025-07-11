// src/app/api/auth/login/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getLoginAuditsContainer, getUsersContainer } from '@/lib/cosmosdb';
import type { User, LoginAudit } from '@/lib/types';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { createJWT } from '@/lib/server-utils';
import { createRefreshToken } from '@/lib/refresh-tokens';

export async function POST(request: NextRequest) {
  try {
    const { email, password: plainTextPassword } = await request.json();

    if (!email || !plainTextPassword) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const usersContainer = await getUsersContainer();
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

    if (!user.password) {
        return NextResponse.json({ message: 'Authentication error' }, { status: 500 });
    }

    const isPasswordMatch = await bcrypt.compare(plainTextPassword, user.password);

    if (!isPasswordMatch) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // Password matches
    // IMPORTANT: Remove password hash before sending user data to client
    const { password: _, ...userProfile } = user;

    // Create login audit entry
    try {
      const loginAuditEntry: LoginAudit = {
        id: uuidv4(),
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        loginTimestamp: new Date().toISOString(),
      };
      const loginAuditsContainer = getLoginAuditsContainer();
      await loginAuditsContainer.items.create(loginAuditEntry);
    } catch (auditError) {
      // Log the audit error but don't fail the login
    }

    // --- Create JWT (60 min) and Refresh Token (90 days) ---
    const token = await createJWT(userProfile, '60m');
    const refreshTokenRecord = await createRefreshToken(user.id, undefined, 90);
    const refreshToken = refreshTokenRecord.id;

    // --- Return both tokens in response for mobile clients ---
    const response = NextResponse.json({ ...userProfile, token, refreshToken }, { status: 200 });

    const hostname = request.headers.get('host') || '';
    const isLocalhost = /localhost|127\.0\.0\.1/i.test(hostname);
    const secureFlag = !isLocalhost && process.env.NODE_ENV === 'production';

    response.cookies.set({
      name: 'session',
      value: token,
      httpOnly: true,
      secure: secureFlag, // Only secure in production and not localhost
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 60 minutes
    });
    // Optionally, set refresh token as httpOnly cookie for web clients (not required for mobile)
    // response.cookies.set({
    //   name: 'refreshToken',
    //   value: refreshToken,
    //   httpOnly: true,
    //   secure: secureFlag,
    //   sameSite: 'lax',
    //   path: '/',
    //   maxAge: 60 * 60 * 24 * 90, // 90 days
    // });
    return response;

  } catch (error) {
    // Removed debug logging for production cleanliness
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

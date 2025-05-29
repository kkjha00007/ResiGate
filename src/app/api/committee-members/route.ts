// src/app/api/committee-members/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { committeeMembersContainer } from '@/lib/cosmosdb';
import type { CommitteeMember } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { logAuditAction } from '@/lib/utils'; // Import logAuditAction

// import { getAuth } from '@clerk/nextjs/server'; // Placeholder if using Clerk for auth

// Helper to check if user is superadmin (replace with your actual auth check)
const isSuperAdmin = (request: NextRequest): boolean => {
  // This is a placeholder. In a real app, you would get the authenticated user's
  // session and check their role. For SWA, this might involve checking headers
  // set by the SWA authentication.
  // For now, we'll assume this check is handled elsewhere or allow for demo purposes.
  // const { userId, sessionClaims } = getAuth(request);
  // return sessionClaims?.metadata.role === 'superadmin';
  return true; // !!IMPORTANT!!: Replace with actual admin check
};

// Helper to extract societyId from request (header, query, or body)
async function getSocietyId(request: NextRequest): Promise<string | null> {
  const headerId = request.headers.get('x-society-id');
  if (headerId) return headerId;
  const urlId = request.nextUrl.searchParams.get('societyId');
  if (urlId) return urlId;
  try {
    const body = await request.json();
    if (body.societyId) return body.societyId;
  } catch {}
  return null;
}

// Get all committee members
export async function GET(request: NextRequest) {
  const societyId = request.headers.get('x-society-id') || request.nextUrl.searchParams.get('societyId');
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  try {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.societyId = @societyId ORDER BY c.name ASC',
      parameters: [{ name: '@societyId', value: societyId }],
    };
    const { resources } = await committeeMembersContainer.items.query<CommitteeMember>(querySpec).fetchAll();
    return NextResponse.json(resources, { status: 200 });
  } catch (error) {
    console.error('Get Committee Members API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Add a new committee member (Super Admin or Society Admin only)
export async function POST(request: NextRequest) {
  const societyId = await getSocietyId(request);
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  // Enforce admin role: only Super Admin or Society Admin can add committee members
  const userRole = request.headers.get('x-user-role');
  const userSocietyId = request.headers.get('x-society-id');
  if (userRole !== 'superadmin' && userRole !== 'societyAdmin') {
    return NextResponse.json({ message: 'Unauthorized: Only Super Admins or Society Admins can add committee members.' }, { status: 403 });
  }
  // Security: Society Admins can only add to their own society
  if (userRole === 'societyAdmin' && userSocietyId !== societyId) {
    return NextResponse.json({ message: 'Forbidden: Society Admins can only manage their own society.' }, { status: 403 });
  }

  try {
    const body = typeof request.body === 'object' ? request.body : await request.json();
    const { name, roleInCommittee, flatNumber } = body;

    // Prevent cross-society data creation
    if (body.societyId && body.societyId !== societyId) {
      return NextResponse.json({ message: 'societyId mismatch between request and body' }, { status: 403 });
    }

    if (!name || !roleInCommittee || !flatNumber) {
      return NextResponse.json({ message: 'Missing required fields: name, roleInCommittee, flatNumber' }, { status: 400 });
    }

    const newMember: CommitteeMember = {
      id: uuidv4(),
      ...body,
      societyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { resource: createdMember } = await committeeMembersContainer.items.create(newMember);

    if (!createdMember) {
      return NextResponse.json({ message: 'Failed to add committee member' }, { status: 500 });
    }
    // Audit log
    try {
      const userId = request.headers.get('x-user-id') || 'unknown';
      const userName = request.headers.get('x-user-name') || 'unknown';
      await logAuditAction({
        societyId,
        userId,
        userName,
        userRole,
        action: 'create',
        targetType: 'CommitteeMember',
        targetId: createdMember.id,
        details: { name, roleInCommittee, flatNumber }
      });
    } catch (e) { console.error('Audit log failed:', e); }
    return NextResponse.json(createdMember, { status: 201 });
  } catch (error) {
    console.error('Add Committee Member API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

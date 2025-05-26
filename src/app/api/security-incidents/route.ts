
// src/app/api/security-incidents/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { securityIncidentsContainer } from '@/lib/cosmosdb';
import type { SecurityIncident, UserProfile } from '@/lib/types';
import { SECURITY_INCIDENT_STATUSES_VALUES } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';

// This function is a placeholder for getting the authenticated user.
// In a real SWA setup, this would involve inspecting headers set by SWA authentication.
// For local dev or other auth, it would be different.
async function getAuthenticatedUser(request: NextRequest): Promise<UserProfile | null> {
  // Placeholder: In a real app, extract user from session/token.
  // For this example, IF you were testing with a client that sends user details in headers:
  const userId = request.headers.get('x-ms-client-principal-id');
  const userName = request.headers.get('x-ms-client-principal-name');
  const userEmail = request.headers.get('x-ms-client-principal-name'); // Often same as name for SWA

  // This is highly simplified. You'd typically fetch full user profile from your DB
  // based on userId or claims to get flatNumber and actual role.
  // For now, we'll assume some basic info or make some fields optional.
  if (userId && userName) {
    // This is a mock profile. In a real app, you'd fetch this from your Users container.
    return {
      id: userId,
      name: userName,
      email: userEmail || 'unknown@example.com',
      role: 'owner', // Placeholder role
      isApproved: true,
      registrationDate: new Date().toISOString(),
      flatNumber: request.headers.get('x-user-flatnumber') || undefined, // Example custom header
    };
  }
  return null;
}

// Submit a new security incident
export async function POST(request: NextRequest) {
  try {
    // In a real app, ensure only authenticated users can submit.
    // The following is a placeholder for user authentication.
    // const user = await getAuthenticatedUser(request); 
    // For now, we'll proceed assuming client sends required user details for demo purposes,
    // or that client-side has user context.
    // In a real app, this would be extracted securely from an auth session.
    const user = await request.json().then(body => body.currentUser as UserProfile | undefined);

    if (!user || !user.id || !user.name) {
         return NextResponse.json({ message: 'Authentication required to report an incident.' }, { status: 401 });
    }


    const body = await request.json(); // Re-parse to get actual incident data
    const {
        incidentDateTime, // Expecting ISO string from client
        location,
        description,
        severity,
    } = body as Omit<SecurityIncident, 'id' | 'reportedByUserId' | 'reportedByUserName' | 'reportedByUserFlatNumber' | 'reportedAt' | 'status'>;

    if (!incidentDateTime || !location || !description || !severity) {
      return NextResponse.json({ message: 'Missing required fields for security incident report' }, { status: 400 });
    }

    const newIncident: SecurityIncident = {
      id: uuidv4(),
      reportedByUserId: user.id,
      reportedByUserName: user.name,
      reportedByUserFlatNumber: user.flatNumber || undefined, // Optional
      incidentDateTime,
      location,
      description,
      severity,
      status: SECURITY_INCIDENT_STATUSES_VALUES[0], // Default to "New"
      reportedAt: new Date().toISOString(),
    };

    const { resource: createdIncident } = await securityIncidentsContainer.items.create(newIncident);

    if (!createdIncident) {
      return NextResponse.json({ message: 'Failed to submit security incident report' }, { status: 500 });
    }

    return NextResponse.json(createdIncident, { status: 201 });

  } catch (error) {
    console.error('Submit Security Incident API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

// GET all security incidents (potentially for admin/guard view - to be secured)
export async function GET(request: NextRequest) {
  // TODO: Secure this endpoint - only admins/guards should access all.
  try {
    const querySpec = {
      query: "SELECT * FROM c ORDER BY c.reportedAt DESC"
    };
    const { resources } = await securityIncidentsContainer.items.query<SecurityIncident>(querySpec).fetchAll();
    return NextResponse.json(resources, { status: 200 });
  } catch (error) {
    console.error('Get All Security Incidents API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

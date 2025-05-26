
// src/app/api/security-incidents/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { securityIncidentsContainer } from '@/lib/cosmosdb';
import type { SecurityIncident, UserProfile } from '@/lib/types';
// CORRECTED IMPORT: Ensure this line imports SECURITY_INCIDENT_STATUSES
import { SECURITY_INCIDENT_STATUSES } from '@/lib/constants';
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
    const body = await request.json();
    // Ensure you're correctly accessing the user object from the request body,
    // assuming it's passed under a 'currentUser' key by the client-side AuthProvider.
    const user = body.currentUser as UserProfile | undefined;

    if (!user || !user.id || !user.name) {
         console.error('Submit Security Incident API error: User not authenticated or user details missing in request body.');
         return NextResponse.json({ message: 'Authentication required to report an incident. Ensure user details are sent correctly.' }, { status: 401 });
    }

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
      status: SECURITY_INCIDENT_STATUSES[0], // Default to "New" using the corrected constant
      reportedAt: new Date().toISOString(),
    };

    const { resource: createdIncident } = await securityIncidentsContainer.items.create(newIncident);

    if (!createdIncident) {
      console.error('Failed to create security incident in Cosmos DB, but no error was thrown by SDK.');
      return NextResponse.json({ message: 'Failed to submit security incident report due to a database issue.' }, { status: 500 });
    }

    return NextResponse.json(createdIncident, { status: 201 });

  } catch (error) {
    console.error('Submit Security Incident API error (detailed):', error); // More detailed log
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while processing your request.';
    return NextResponse.json({ message: 'Internal server error', detail: errorMessage }, { status: 500 });
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

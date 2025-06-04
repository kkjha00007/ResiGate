// src/app/api/audit-logs/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getAuditLogsContainer } from '@/lib/cosmosdb';
import type { AuditLogEntry } from '@/lib/types';

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

// GET /api/audit-logs - Get audit logs for a society (Super Admin or Society Admin only)
export async function GET(request: NextRequest) {
  const societyId = await getSocietyId(request);
  let querySpec;
  if (societyId) {
    querySpec = {
      query: 'SELECT * FROM c WHERE c.societyId = @societyId ORDER BY c.timestamp DESC',
      parameters: [{ name: '@societyId', value: societyId }],
    };
  } else {
    // Allow superadmin to fetch all logs if no societyId is provided
    querySpec = {
      query: 'SELECT * FROM c ORDER BY c.timestamp DESC',
      parameters: [],
    };
  }
  let auditLogsContainer;
  try {
    auditLogsContainer = getAuditLogsContainer();
  } catch (err) {
    return NextResponse.json({ message: 'Cosmos DB connection is not configured.' }, { status: 500 });
  }
  try {
    const { resources: logs } = await auditLogsContainer.items.query<AuditLogEntry>(querySpec).fetchAll();
    return NextResponse.json(logs, { status: 200 });
  } catch (error) {
    console.error('Get Audit Logs API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

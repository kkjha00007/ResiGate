import { NextRequest, NextResponse } from 'next/server';

// GET /api/society-upload/audit
export async function GET() {
  const g = globalThis as any;
  return NextResponse.json({ audit: g.societyUploadAudit || [] });
}

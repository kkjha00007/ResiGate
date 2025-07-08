import { NextRequest, NextResponse } from 'next/server';
import { staged } from './route';

// POST /api/society-upload/rollback
export async function POST(req: NextRequest) {
  // Clear staged data for all types
  staged.residents = [];
  staged.staff = [];
  staged.vehicles = [];
  // Audit log
  const g = globalThis as any;
  if (!g.societyUploadAudit) g.societyUploadAudit = [];
  g.societyUploadAudit.push({
    action: 'rollback',
    at: Date.now(),
    user: req.headers.get('x-user') || 'unknown',
  });
  return NextResponse.json({ success: true, message: 'Staged data rolled back.' });
}

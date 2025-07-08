import { NextRequest, NextResponse } from 'next/server';

// Use the same staged object as in route.ts (in-memory for demo)
import { staged } from './route';

// POST /api/society-upload/push
export async function POST(req: NextRequest) {
  // In real app, move staged data to production DB
  // For demo, just clear staged and return success
  staged.residents = [];
  staged.staff = [];
  staged.vehicles = [];
  // Audit log
  const g = globalThis as any;
  if (!g.societyUploadAudit) g.societyUploadAudit = [];
  g.societyUploadAudit.push({
    action: 'push',
    at: Date.now(),
    user: req.headers.get('x-user') || 'unknown',
  });
  return NextResponse.json({ success: true, message: 'Data pushed to production.' });
}

import { NextRequest, NextResponse } from 'next/server';
import { generateTemplate } from '@/lib/excel-templates';

// GET /api/society-upload/template?type=residents|staff|vehicles
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  if (!type || !['residents', 'staff', 'vehicles'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }
  const buffer = await generateTemplate(type as any);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${type}-template.xlsx"`,
    },
  });
}

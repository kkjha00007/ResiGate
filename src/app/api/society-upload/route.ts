import { NextRequest, NextResponse } from 'next/server';
import { validateExcelFile } from '@/lib/excel-validate';

// In-memory staged data (for demo; use DB in production)
export const staged: Record<string, any[]> = { residents: [], staff: [], vehicles: [] };

// POST /api/society-upload
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file');
  const type = formData.get('type');
  if (!file || typeof type !== 'string' || !['residents','staff','vehicles'].includes(type)) {
    return NextResponse.json({ error: 'Missing file or type' }, { status: 400 });
  }
  // Validate Excel
  try {
    const summary = await validateExcelFile(file as File, type);
    // Save staged data (store all valid rows for tracker/audit)
    if (!staged[type]) staged[type] = [];
    if (summary.valid > 0) {
      // Parse valid rows for tracker
      const arrayBuffer = await (file as File).arrayBuffer();
      const { Workbook } = await import('exceljs');
      const wb = new Workbook();
      await wb.xlsx.load(arrayBuffer);
      const ws = wb.worksheets[0];
      const validRows: any[] = [];
      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const values = Array.isArray(row.values) ? row.values.slice(1) : [];
        let isValid = false;
        if (type === 'residents') {
          const [name, flat, email] = values;
          isValid = Boolean(name) && Boolean(flat) && (!email || String(email).includes('@'));
        } else if (type === 'staff') {
          const [name, role] = values;
          isValid = Boolean(name) && Boolean(role);
        } else if (type === 'vehicles') {
          const [owner, number] = values;
          isValid = Boolean(owner) && Boolean(number);
        }
        if (isValid) validRows.push({ row: rowNumber, values });
      });
      staged[type] = validRows;
    }
    // Add audit log (in-memory for demo)
    // Type-safe global audit log
    const g = globalThis as any;
    if (!g.societyUploadAudit) g.societyUploadAudit = [];
    g.societyUploadAudit.push({
      action: 'upload',
      type,
      summary,
      at: Date.now(),
      user: req.headers.get('x-user') || 'unknown',
    });
    return NextResponse.json({ success: true, type, summary });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// Excel template generation for Residents, Staff, Vehicles
import { Workbook } from 'exceljs';

export async function generateTemplate(type: 'residents' | 'staff' | 'vehicles'): Promise<ArrayBuffer> {
  const wb = new Workbook();
  const ws = wb.addWorksheet('Template');
  // Add header row
  if (type === 'residents') {
    ws.addRow(['Name', 'Flat Number', 'Email', 'Phone', 'Move-in Date']);
  } else if (type === 'staff') {
    ws.addRow(['Name', 'Role', 'Phone', 'ID Number']);
  } else if (type === 'vehicles') {
    ws.addRow(['Owner Name', 'Vehicle Number', 'Type', 'Parking Slot']);
  }

  // Add a Notes sheet with instructions
  const notes = wb.addWorksheet('Notes');
  notes.addRow(['Instructions:']);
  if (type === 'residents') {
    notes.addRow(['- Fill all columns. Email is optional but must be valid if provided.']);
    notes.addRow(['- Move-in Date format: YYYY-MM-DD']);
  } else if (type === 'staff') {
    notes.addRow(['- Role is required. Phone is optional.']);
  } else if (type === 'vehicles') {
    notes.addRow(['- Vehicle Number must be unique. Parking Slot is optional.']);
  }
  notes.addRow(['- Do not change the header row.']);

  // Add a footer row to the main sheet
  ws.addRow([]);
  ws.addRow(['--- End of Template ---']);

  // Always return as ArrayBuffer for browser/server compatibility
  // Ensure return type is ArrayBuffer for Next.js API
  const buf = await wb.xlsx.writeBuffer();
  // Ensure the result is always ArrayBuffer
  if (buf instanceof ArrayBuffer) return buf;
  // Fallback: throw error for unknown type
  throw new Error('Unknown buffer type returned by exceljs');
}

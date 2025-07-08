import { Workbook } from 'exceljs';

// Parse and validate Excel file for residents, staff, or vehicles
export async function validateExcelFile(file: File, type: string) {
  const arrayBuffer = await file.arrayBuffer();
  const wb = new Workbook();
  await wb.xlsx.load(arrayBuffer);
  const ws = wb.worksheets[0];
  let errorsList: { row: number; message: string }[] = [];
  let valid = 0;
  let total = 0;
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    total++;
    // Defensive: row.values is an array, but may have extra props, so always slice if possible
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    if (type === 'residents') {
      const [name, flat, email, phone, moveIn] = values;
      if (!name || !flat) errorsList.push({ row: rowNumber, message: 'Name and Flat required' });
      else if (email && !String(email).includes('@')) errorsList.push({ row: rowNumber, message: 'Invalid email' });
      else valid++;
    } else if (type === 'staff') {
      const [name, role, phone, id] = values;
      if (!name || !role) errorsList.push({ row: rowNumber, message: 'Name and Role required' });
      else valid++;
    } else if (type === 'vehicles') {
      const [owner, number, vtype, slot] = values;
      if (!owner || !number) errorsList.push({ row: rowNumber, message: 'Owner and Vehicle Number required' });
      else valid++;
    }
  });
  return { total, valid, errors: errorsList.length, errorsList };
}

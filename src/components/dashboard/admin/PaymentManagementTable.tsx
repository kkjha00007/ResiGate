import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import jsPDF from 'jspdf';
import type { Payment } from '@/lib/types';

export default function PaymentManagementTable({ societyId }: { societyId: string }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/billing/payments?societyId=${societyId}`)
      .then(res => res.json())
      .then(data => setPayments(data.payments || []))
      .finally(() => setLoading(false));
  }, [societyId]);

  // --- Export All Payments as CSV ---
  const exportAllPaymentsCSV = () => {
    if (!payments.length) return;
    const headers = [
      'ID', 'Flat', 'User', 'Amount', 'Date', 'Mode', 'Reference', 'Bill ID', 'Notes'
    ];
    const rows = payments.map(p => [
      p.id, p.flatNumber, p.userId, p.amount, p.paymentDate, p.mode, p.referenceNumber, p.billId, p.notes
    ]);
    const csv = [headers, ...rows].map(r => r.map(x => `"${x ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_payments_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Export All Payments as PDF ---
  const exportAllPaymentsPDF = () => {
    if (!payments.length) return;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('All Payments Export', 10, 15);
    let y = 25;
    payments.forEach((p, idx) => {
      doc.setFontSize(11);
      doc.text(`Flat: ${p.flatNumber} | User: ${p.userId} | Amount: ₹${p.amount} | Date: ${p.paymentDate} | Mode: ${p.mode}`, 10, y);
      y += 7;
      if (p.billId) { doc.text(`  Bill ID: ${p.billId}`, 12, y); y += 6; }
      if (p.referenceNumber) { doc.text(`  Ref: ${p.referenceNumber}`, 12, y); y += 6; }
      if (p.notes) { doc.text(`  Notes: ${p.notes}`, 12, y); y += 6; }
      y += 2;
      if (y > 270) { doc.addPage(); y = 15; }
    });
    doc.save('all_payments_export.pdf');
  };

  return (
    <Card className="shadow-lg mt-8">
      <CardHeader>
        <CardTitle>Payments</CardTitle>
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="outline" onClick={exportAllPaymentsCSV}>Export All (CSV)</Button>
          <Button size="sm" variant="outline" onClick={exportAllPaymentsPDF}>Export All (PDF)</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Flat</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Bill ID</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8}>Loading...</TableCell></TableRow>
            ) : payments.length === 0 ? (
              <TableRow><TableCell colSpan={8}>No payments found.</TableCell></TableRow>
            ) : payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.flatNumber}</TableCell>
                <TableCell>{p.userId}</TableCell>
                <TableCell>₹{p.amount}</TableCell>
                <TableCell>{p.paymentDate}</TableCell>
                <TableCell>{p.mode}</TableCell>
                <TableCell>{p.referenceNumber}</TableCell>
                <TableCell>{p.billId}</TableCell>
                <TableCell>{p.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

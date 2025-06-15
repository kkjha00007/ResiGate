// src/components/dashboard/MyBillsTable.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import type { MaintenanceBill } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import jsPDF from 'jspdf';

export function MyBillsTable() {
  const { user } = useAuth();
  const [bills, setBills] = useState<MaintenanceBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [schedule, setSchedule] = useState<{ dayOfMonth: number; hour: number; minute: number; enabled: boolean } | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [disputeBillId, setDisputeBillId] = useState<string | null>(null);
  const [disputeText, setDisputeText] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/billing/bills?societyId=${user.societyId}&userId=${user.id}`)
      .then(res => res.json())
      .then(data => setBills(data.bills || []))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/billing/bills/reminders/schedule?societyId=${user.societyId}&userId=${user.id}`)
      .then(res => res.json())
      .then(data => setSchedule(data.schedule))
      .catch(() => setSchedule(null));
  }, [user]);

  const triggerReminder = async () => {
    if (!user) return;
    setReminderLoading(true);
    await fetch('/api/billing/bills/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ societyId: user.societyId, dryRun: false }),
    });
    setReminderLoading(false);
    alert('Reminder sent!');
  };

  const saveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !schedule) return;
    setSavingSchedule(true);
    await fetch('/api/billing/bills/reminders/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        societyId: user.societyId,
        userId: user.id,
        ...schedule,
      }),
    });
    setSavingSchedule(false);
    setShowScheduleForm(false);
    alert('Schedule saved!');
  };

  const downloadBill = (bill: MaintenanceBill, format: 'json' | 'csv' | 'pdf') => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(bill, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bill_${bill.period}_${bill.flatNumber}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const csv = [
        'Field,Value',
        ...Object.entries(bill).map(([k, v]) => `${k},"${typeof v === 'object' ? JSON.stringify(v) : v}"`)
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bill_${bill.period}_${bill.flatNumber}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Maintenance Bill', 10, 15);
      doc.setFontSize(12);
      let y = 30;
      doc.text(`Flat: ${bill.flatNumber || user?.flatNumber || ''}`, 10, y);
      y += 8;
      doc.text(`Period: ${bill.period}`, 10, y);
      y += 8;
      doc.text(`Amount: ₹${bill.amount}`, 10, y);
      y += 8;
      doc.text(`Due Date: ${bill.dueDate}`, 10, y);
      y += 8;
      doc.text(`Status: ${bill.status}`, 10, y);
      y += 8;
      if (bill.paidAt) {
        doc.text(`Paid At: ${new Date(bill.paidAt).toLocaleDateString()}`, 10, y);
        y += 8;
      }
      if (bill.breakdown) {
        doc.text('Breakdown:', 10, y);
        y += 6;
        Object.entries(bill.breakdown).forEach(([cat, amt]) => {
          doc.text(`- ${cat}: ₹${amt}`, 14, y);
          y += 6;
        });
      }
      if (bill.discountAmount) {
        doc.text(`Discount: -₹${bill.discountAmount} (${bill.discountReason || ''})`, 10, y);
        y += 6;
      }
      if (bill.waiverAmount) {
        doc.text(`Waiver: -₹${bill.waiverAmount} (${bill.waiverReason || ''})`, 10, y);
        y += 6;
      }
      if (bill.penaltyAmount) {
        doc.text(`Penalty: +₹${bill.penaltyAmount} (${bill.penaltyReason || ''})`, 10, y);
        y += 6;
      }
      doc.text(`Net Amount: ₹${bill.amount}`, 10, y);
      doc.save(`bill_${bill.period}_${bill.flatNumber}.pdf`);
    }
  };

  const downloadReceipt = (bill: MaintenanceBill) => {
    if (!bill.paidAt) return;
    // PDF receipt
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Payment Receipt', 10, 15);
    doc.setFontSize(12);
    let y = 30;
    doc.text(`Flat: ${bill.flatNumber || user?.flatNumber || ''}`, 10, y);
    y += 8;
    doc.text(`Period: ${bill.period}`, 10, y);
    y += 8;
    doc.text(`Paid Amount: ₹${bill.paidAmount}`, 10, y);
    y += 8;
    doc.text(`Paid At: ${bill.paidAt ? new Date(bill.paidAt).toLocaleDateString() : '-'}`, 10, y);
    y += 8;
    if (bill.paymentIds) {
      doc.text(`Payment IDs: ${bill.paymentIds.join(', ')}`, 10, y);
      y += 8;
    }
    doc.save(`receipt_${bill.period}_${bill.flatNumber}.pdf`);
  };

  const openDispute = (billId: string) => {
    setDisputeBillId(billId);
    setDisputeText('');
    setDisputeSuccess(false);
  };

  const submitDispute = async () => {
    if (!disputeBillId || !disputeText) return;
    setDisputeLoading(true);
    const res = await fetch(`/api/billing/bills/${disputeBillId}/dispute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: disputeText }),
    });
    setDisputeLoading(false);
    if (res.ok) {
      setDisputeSuccess(true);
    } else {
      alert('Failed to submit dispute.');
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>My Maintenance Bills</CardTitle>
        {user?.creditBalance !== undefined && (
          <div className="mt-2 text-green-700 font-semibold text-sm">
            Advance/Credit Balance: ₹{user.creditBalance.toFixed(2)}
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={triggerReminder} disabled={reminderLoading}>
            {reminderLoading ? 'Sending...' : 'Send Reminder Now'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowScheduleForm(v => !v)}>
            {showScheduleForm ? 'Cancel' : 'Set Reminder Schedule'}
          </Button>
        </div>
        {showScheduleForm && (
          <form className="mt-4 flex gap-2 items-center" onSubmit={saveSchedule}>
            <label>Day of Month:
              <input type="number" min={1} max={31} value={schedule?.dayOfMonth ?? 1} onChange={e => setSchedule(s => ({ ...s!, dayOfMonth: Number(e.target.value) }))} className="ml-1 border rounded px-1 w-16" />
            </label>
            <label>Hour:
              <input type="number" min={0} max={23} value={schedule?.hour ?? 9} onChange={e => setSchedule(s => ({ ...s!, hour: Number(e.target.value) }))} className="ml-1 border rounded px-1 w-12" />
            </label>
            <label>Minute:
              <input type="number" min={0} max={59} value={schedule?.minute ?? 0} onChange={e => setSchedule(s => ({ ...s!, minute: Number(e.target.value) }))} className="ml-1 border rounded px-1 w-12" />
            </label>
            <label>
              <input type="checkbox" checked={schedule?.enabled ?? true} onChange={e => setSchedule(s => ({ ...s!, enabled: e.target.checked }))} className="ml-2" /> Enabled
            </label>
            <Button size="sm" type="submit" disabled={savingSchedule}>{savingSchedule ? 'Saving...' : 'Save'}</Button>
          </form>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Paid At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
            ) : bills.length === 0 ? (
              <TableRow><TableCell colSpan={6}>No bills found.</TableCell></TableRow>
            ) : bills.map((bill) => [
              <TableRow key={bill.id}>
                <TableCell>{bill.period}</TableCell>
                <TableCell>₹{bill.amount}</TableCell>
                <TableCell>{bill.status}</TableCell>
                <TableCell>{bill.dueDate}</TableCell>
                <TableCell>{bill.paidAt ? new Date(bill.paidAt).toLocaleDateString() : '-'}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => setExpanded(expanded === bill.id ? null : bill.id)}>
                    {expanded === bill.id ? 'Hide' : 'Breakdown'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => downloadBill(bill, 'json')}>Download Bill (JSON)</Button>
                  <Button size="sm" variant="outline" onClick={() => downloadBill(bill, 'csv')}>Download Bill (CSV)</Button>
                  <Button size="sm" variant="outline" onClick={() => downloadBill(bill, 'pdf')}>Download Bill (PDF)</Button>
                  {bill.paidAt && <Button size="sm" variant="outline" onClick={() => downloadReceipt(bill)}>Download Receipt (PDF)</Button>}
                  <Button size="sm" variant="destructive" onClick={() => openDispute(bill.id)}>Raise Dispute/Query</Button>
                  {bill.status === 'unpaid' && <Button size="sm">Pay Now</Button>}
                </TableCell>
              </TableRow>,
              expanded === bill.id && (
                <TableRow key={bill.id + '-breakdown'}>
                  <TableCell colSpan={6}>
                    <div className="p-2 bg-gray-50 rounded">
                      <b>Breakdown:</b>
                      <ul className="ml-4">
                        {bill.breakdown && Object.entries(bill.breakdown).map(([cat, amt]) => (
                          <li key={cat}>{cat}: ₹{amt}</li>
                        ))}
                        {bill.adHocCharges && bill.adHocCharges.map((charge, i) => (
                          <li key={i} className="text-orange-700">Ad-hoc: {charge.label} ₹{charge.amount} {charge.isOneTime ? '(One-time)' : ''} {charge.description && <span>- {charge.description}</span>}</li>
                        ))}
                      </ul>
                      {bill.discountAmount && (
                        <div className="text-green-700">Discount: -₹{bill.discountAmount} {bill.discountReason && <span>({bill.discountReason})</span>}</div>
                      )}
                      {bill.waiverAmount && (
                        <div className="text-blue-700">Waiver: -₹{bill.waiverAmount} {bill.waiverReason && <span>({bill.waiverReason})</span>}</div>
                      )}
                      {bill.penaltyAmount && (
                        <div className="text-red-700">Penalty: +₹{bill.penaltyAmount} {bill.penaltyReason && <span>({bill.penaltyReason})</span>}</div>
                      )}
                      <div className="font-bold mt-2">Net Amount: ₹{bill.amount}</div>
                    </div>
                  </TableCell>
                </TableRow>
              )
            ])}
          </TableBody>
        </Table>
      </CardContent>
      <Dialog open={!!disputeBillId} onOpenChange={open => { if (!open) setDisputeBillId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise Dispute/Query</DialogTitle>
          </DialogHeader>
          {disputeSuccess ? (
            <div className="text-green-700 font-semibold">Your dispute/query has been submitted!</div>
          ) : (
            <>
              <Textarea value={disputeText} onChange={e => setDisputeText(e.target.value)} placeholder="Describe your issue or query about this bill..." rows={4} />
              <DialogFooter>
                <Button onClick={submitDispute} disabled={disputeLoading || !disputeText}>{disputeLoading ? 'Submitting...' : 'Submit'}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default MyBillsTable;

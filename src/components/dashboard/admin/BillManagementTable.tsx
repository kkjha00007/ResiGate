// src/components/dashboard/admin/BillManagementTable.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import type { MaintenanceBill } from '@/lib/types';
import { useAuth } from '@/lib/auth-provider';
import { USER_ROLES } from '@/lib/constants';
import jsPDF from 'jspdf';

export function BillManagementTable() {
  const { user } = useAuth();
  const [bills, setBills] = useState<MaintenanceBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingBill, setEditingBill] = useState<MaintenanceBill | null>(null);
  const [editFields, setEditFields] = useState<any>({});
  const [adHocCharges, setAdHocCharges] = useState<any[]>([]);
  const [multiPeriod, setMultiPeriod] = useState({ startPeriod: '', frequency: 'monthly', count: 3 });

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/billing/bills?societyId=${user.societyId}`)
      .then(res => res.json())
      .then(data => setBills(data.bills || []))
      .finally(() => setLoading(false));
  }, [refresh, user]);

  useEffect(() => {
    if (editingBill) {
      setEditFields({
        discountAmount: editingBill.discountAmount || '',
        discountReason: editingBill.discountReason || '',
        penaltyAmount: editingBill.penaltyAmount || '',
        penaltyReason: editingBill.penaltyReason || '',
        waiverAmount: editingBill.waiverAmount || '',
        waiverReason: editingBill.waiverReason || '',
      });
      setAdHocCharges(editingBill.adHocCharges ? [...editingBill.adHocCharges] : []);
    }
  }, [editingBill]);

  const handleGenerateBills = async () => {
    if (!user) return;
    // Example: generate bills for current month (real logic can be added)
    await fetch('/api/billing/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate',
        societyId: user.societyId,
        period: '2025-06',
        amount: 2500, // Example default, replace with UI value if needed
        dueDate: '2025-06-30', // Example default, replace with UI value if needed
        flats: [{ flatNumber: user.flatNumber, userId: user.id }] // Replace with all flats for real use
      })
    });
    setRefresh(r => r + 1);
  };

  const handleMultiPeriodGenerate = async () => {
    if (!user) return;
    await fetch('/api/billing/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate',
        societyId: user.societyId,
        startPeriod: multiPeriod.startPeriod,
        frequency: multiPeriod.frequency,
        count: multiPeriod.count,
        dueDate: multiPeriod.startPeriod ? multiPeriod.startPeriod + '-28' : '', // Example: last day of month
        flats: [{ flatNumber: user.flatNumber, userId: user.id }], // Replace with all flats for real use
      })
    });
    setRefresh(r => r + 1);
  };

  const handleEditChange = (field: string, value: any) => {
    setEditFields((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleAdHocChange = (idx: number, field: string, value: any) => {
    setAdHocCharges(charges => charges.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };
  const addAdHocCharge = () => setAdHocCharges([...adHocCharges, { label: '', amount: 0, description: '', isOneTime: true }]);
  const removeAdHocCharge = (idx: number) => setAdHocCharges(charges => charges.filter((_, i) => i !== idx));

  const handleEditSave = async () => {
    // Validation for ad-hoc charges
    for (const [i, charge] of adHocCharges.entries()) {
      if (!charge.label || !charge.label.trim()) {
        alert(`Ad-hoc charge #${i + 1} is missing a label.`);
        return;
      }
      if (isNaN(Number(charge.amount)) || Number(charge.amount) <= 0) {
        alert(`Ad-hoc charge #${i + 1} must have a positive amount.`);
        return;
      }
    }
    // Validation for discounts/penalties/waivers
    if (editFields.discountAmount && Number(editFields.discountAmount) < 0) {
      alert('Discount amount cannot be negative.');
      return;
    }
    if (editFields.penaltyAmount && Number(editFields.penaltyAmount) < 0) {
      alert('Penalty amount cannot be negative.');
      return;
    }
    if (editFields.waiverAmount && Number(editFields.waiverAmount) < 0) {
      alert('Waiver amount cannot be negative.');
      return;
    }
    if (!editingBill) return;
    await fetch('/api/billing/bills', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingBill.id,
        societyId: editingBill.societyId,
        ...editFields,
        discountAmount: editFields.discountAmount ? Number(editFields.discountAmount) : undefined,
        penaltyAmount: editFields.penaltyAmount ? Number(editFields.penaltyAmount) : undefined,
        waiverAmount: editFields.waiverAmount ? Number(editFields.waiverAmount) : undefined,
        adHocCharges,
      })
    });
    setEditingBill(null);
    setRefresh(r => r + 1);
  };

  const handleEditCancel = () => setEditingBill(null);

  // Add approval action handler:
  const handleApprovalAction = async (bill: MaintenanceBill, newStatus: any) => {
    await fetch('/api/billing/bills', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: bill.id,
        societyId: bill.societyId,
        approvalStatus: newStatus,
        changedBy: user?.id,
        changedByName: user?.name,
        approvalNotes: '',
      })
    });
    setRefresh(r => r + 1);
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
      const csvRows = [
        ['Field', 'Value'],
        ['Flat', bill.flatNumber],
        ['Period', bill.period],
        ['Amount', bill.amount],
        ['Due Date', bill.dueDate],
        ['Status', bill.status],
        ['Paid At', bill.paidAt ? new Date(bill.paidAt).toLocaleDateString() : '-'],
      ];
      if (bill.breakdown) {
        csvRows.push(['Breakdown', '']);
        Object.entries(bill.breakdown).forEach(([cat, amt]) => {
          csvRows.push([` ${cat}`, amt]);
        });
      }
      if (bill.discountAmount) {
        csvRows.push(['Discount', `-₹${bill.discountAmount} (${bill.discountReason || ''})`]);
      }
      if (bill.waiverAmount) {
        csvRows.push(['Waiver', `-₹${bill.waiverAmount} (${bill.waiverReason || ''})`]);
      }
      if (bill.penaltyAmount) {
        csvRows.push(['Penalty', `+₹${bill.penaltyAmount} (${bill.penaltyReason || ''})`]);
      }
      const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const a = document.createElement('a');
      a.setAttribute('href', encodedUri);
      a.setAttribute('download', `bill_${bill.period}_${bill.flatNumber}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Maintenance Bill', 10, 15);
      doc.setFontSize(12);
      let y = 30;
      doc.text(`Flat: ${bill.flatNumber}`, 10, y);
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
    doc.text(`Flat: ${bill.flatNumber}`, 10, y);
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

  // --- Export All Bills as CSV ---
  const exportAllBillsCSV = () => {
    if (!bills.length) return;
    const headers = [
      'ID', 'Flat', 'Period', 'Amount', 'Due Date', 'Status', 'Approval', 'Paid At', 'Discount', 'Penalty', 'Waiver', 'Notes'
    ];
    const rows = bills.map(bill => [
      bill.id, bill.flatNumber, bill.period, bill.amount, bill.dueDate, bill.status, bill.approvalStatus, bill.paidAt, bill.discountAmount, bill.penaltyAmount, bill.waiverAmount, bill.notes
    ]);
    const csv = [headers, ...rows].map(r => r.map(x => `"${x ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_bills_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Export All Bills as PDF ---
  const exportAllBillsPDF = () => {
    if (!bills.length) return;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('All Maintenance Bills Export', 10, 15);
    let y = 25;
    bills.forEach((bill, idx) => {
      doc.setFontSize(11);
      doc.text(`Flat: ${bill.flatNumber} | Period: ${bill.period} | Amount: ₹${bill.amount} | Status: ${bill.status}`, 10, y);
      y += 7;
      if (bill.breakdown) {
        Object.entries(bill.breakdown).forEach(([cat, amt]) => {
          doc.text(`  - ${cat}: ₹${amt}`, 12, y);
          y += 6;
        });
      }
      if (bill.discountAmount) { doc.text(`  Discount: -₹${bill.discountAmount}`, 12, y); y += 6; }
      if (bill.penaltyAmount) { doc.text(`  Penalty: +₹${bill.penaltyAmount}`, 12, y); y += 6; }
      if (bill.waiverAmount) { doc.text(`  Waiver: -₹${bill.waiverAmount}`, 12, y); y += 6; }
      if (bill.notes) { doc.text(`  Notes: ${bill.notes}`, 12, y); y += 6; }
      y += 2;
      if (y > 270) { doc.addPage(); y = 15; }
    });
    doc.save('all_bills_export.pdf');
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Maintenance Bills</CardTitle>
        {/* Multi-Period Bill Generation UI */}
        <div className="flex flex-wrap gap-4 items-end mt-2">
          <div>
            <label className="block text-xs font-semibold">Start Period (YYYY-MM)</label>
            <input type="month" value={multiPeriod.startPeriod} onChange={e => setMultiPeriod(p => ({ ...p, startPeriod: e.target.value }))} className="input input-bordered w-36" />
          </div>
          <div>
            <label className="block text-xs font-semibold">Frequency</label>
            <select value={multiPeriod.frequency} onChange={e => setMultiPeriod(p => ({ ...p, frequency: e.target.value }))} className="input input-bordered w-28">
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold">Count</label>
            <input type="number" min={1} max={24} value={multiPeriod.count} onChange={e => setMultiPeriod(p => ({ ...p, count: Number(e.target.value) }))} className="input input-bordered w-20" />
          </div>
          <Button onClick={handleMultiPeriodGenerate} disabled={loading || !multiPeriod.startPeriod || !multiPeriod.count}>Generate Multi-Period Bills</Button>
        </div>
        <Button className="mt-2" onClick={handleGenerateBills} disabled={loading}>
          {loading ? 'Loading...' : 'Generate Bills'}
        </Button>
      </CardHeader>
      <CardContent>
        {/* Add a simple reporting section above the table: */}
        <Card className="mb-4 p-4 bg-gray-50">
          <div className="font-bold mb-2">Billing Summary (Current View)</div>
          <div className="flex flex-wrap gap-6">
            <div>Total Bills: {bills.length}</div>
            <div>Total Amount: ₹{bills.reduce((sum, b) => sum + (b.amount || 0), 0)}</div>
            <div>Total Paid: ₹{bills.reduce((sum, b) => sum + (b.paidAmount || 0), 0)}</div>
            <div>Total Outstanding: ₹{bills.reduce((sum, b) => sum + ((b.status === 'unpaid' || b.status === 'overdue') ? (b.amount || 0) : 0), 0)}</div>
            <div>Total Discounts: ₹{bills.reduce((sum, b) => sum + (b.discountAmount || 0), 0)}</div>
            <div>Total Penalties: ₹{bills.reduce((sum, b) => sum + (b.penaltyAmount || 0), 0)}</div>
            <div>Total Waivers: ₹{bills.reduce((sum, b) => sum + (b.waiverAmount || 0), 0)}</div>
            <div>Total Ad-hoc: ₹{bills.reduce((sum, b) => sum + (b.adHocCharges ? b.adHocCharges.reduce((s, c) => s + (c.amount || 0), 0) : 0), 0)}</div>
          </div>
        </Card>
        {/* Add advanced reporting to BillManagementTable: */}
        <Card className="mb-4 p-4 bg-gray-50">
          <div className="font-bold mb-2">Advanced Reports</div>
          <div className="flex flex-wrap gap-6">
            {/* By Period */}
            <div>
              <div className="font-semibold">By Period</div>
              <ul>
                {Array.from(new Set(bills.map(b => b.period))).sort().map(period => (
                  <li key={period}>
                    {period}: ₹{bills.filter(b => b.period === period).reduce((sum, b) => sum + (b.amount || 0), 0)}
                  </li>
                ))}
              </ul>
            </div>
            {/* By Flat */}
            <div>
              <div className="font-semibold">By Flat</div>
              <ul>
                {Array.from(new Set(bills.map(b => b.flatNumber))).sort().map(flat => (
                  <li key={flat}>
                    {flat}: ₹{bills.filter(b => b.flatNumber === flat).reduce((sum, b) => sum + (b.amount || 0), 0)}
                  </li>
                ))}
              </ul>
            </div>
            {/* By Category (from breakdown) */}
            <div>
              <div className="font-semibold">By Category</div>
              <ul>
                {(() => {
                  const catTotals: Record<string, number> = {};
                  bills.forEach(bill => {
                    if (bill.breakdown) {
                      Object.entries(bill.breakdown).forEach(([cat, amt]) => {
                        catTotals[cat] = (catTotals[cat] || 0) + (amt || 0);
                      });
                    }
                    if (bill.adHocCharges) {
                      bill.adHocCharges.forEach(c => {
                        if (c.categoryKey) {
                          catTotals[c.categoryKey] = (catTotals[c.categoryKey] || 0) + (c.amount || 0);
                        } else {
                          catTotals['Ad-hoc'] = (catTotals['Ad-hoc'] || 0) + (c.amount || 0);
                        }
                      });
                    }
                  });
                  return Object.entries(catTotals).map(([cat, amt]) => (
                    <li key={cat}>{cat}: ₹{amt}</li>
                  ));
                })()}
              </ul>
            </div>
          </div>
        </Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Flat</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approval</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Paid At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7}>Loading...</TableCell></TableRow>
            ) : bills.length === 0 ? (
              <TableRow><TableCell colSpan={7}>No bills found.</TableCell></TableRow>
            ) : bills.map((bill) => [
              <TableRow key={bill.id}>
                <TableCell>{bill.flatNumber}</TableCell>
                <TableCell>{bill.period}</TableCell>
                <TableCell>₹{bill.amount}</TableCell>
                <TableCell>{bill.status}</TableCell>
                <TableCell>{bill.approvalStatus || 'draft'}</TableCell>
                <TableCell>{bill.dueDate}</TableCell>
                <TableCell>{bill.paidAt ? new Date(bill.paidAt).toLocaleDateString() : '-'}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => setExpanded(expanded === bill.id ? null : bill.id)}>
                    {expanded === bill.id ? 'Hide' : 'Breakdown'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditingBill(bill)} className="ml-2">
                    Edit
                  </Button>
                  {/* Approval workflow actions */}
                  {bill.approvalStatus === 'draft' && (
                    <Button size="sm" className="ml-2" onClick={() => handleApprovalAction(bill, 'pending_approval')}>Submit for Approval</Button>
                  )}
                  {bill.approvalStatus === 'pending_approval' && user?.primaryRole === USER_ROLES.SOCIETY_ADMIN && (
                    <>
                      <Button size="sm" className="ml-2" onClick={() => handleApprovalAction(bill, 'approved')}>Approve</Button>
                      <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleApprovalAction(bill, 'rejected')}>Reject</Button>
                    </>
                  )}
                  {bill.approvalStatus === 'approved' && (
                    <Button size="sm" className="ml-2" onClick={() => handleApprovalAction(bill, 'published')}>Publish</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => downloadBill(bill, 'pdf')}>Download Bill (PDF)</Button>
                  {bill.paidAt && <Button size="sm" variant="outline" onClick={() => downloadReceipt(bill)}>Download Receipt (PDF)</Button>}
                </TableCell>
              </TableRow>,
              expanded === bill.id && (
                <TableRow key={bill.id + '-breakdown'}>
                  <TableCell colSpan={7}>
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
                      {/* --- Audit Trail Section --- */}
                      {bill.auditTrail && bill.auditTrail.length > 0 && (
                        <div className="mt-4">
                          <b>Audit Trail:</b>
                          <ul className="text-xs bg-gray-100 p-2 rounded max-h-40 overflow-y-auto">
                            {bill.auditTrail.map((entry, i) => (
                              <li key={entry.id || i} className="mb-1">
                                <span className="font-semibold">{entry.changeType.toUpperCase()}</span> by {entry.changedByName || entry.changedBy} ({entry.changedByRole || 'user'}) at {new Date(entry.changedAt).toLocaleString()} {entry.notes && <span>- {entry.notes}</span>}
                                {entry.field && <span> [Field: {entry.field}]</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            ])}
          </TableBody>
        </Table>
      </CardContent>
      {editingBill && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="font-bold text-lg mb-2">Edit Bill Adjustments (Flat {editingBill.flatNumber}, Period {editingBill.period})</h2>
            <div className="mb-2">
              <label className="block font-semibold">Discount Amount</label>
              <input type="number" className="input input-bordered w-full" value={editFields.discountAmount} onChange={e => handleEditChange('discountAmount', e.target.value)} />
              <input type="text" className="input input-bordered w-full mt-1" placeholder="Discount Reason" value={editFields.discountReason} onChange={e => handleEditChange('discountReason', e.target.value)} />
            </div>
            <div className="mb-2">
              <label className="block font-semibold">Waiver Amount</label>
              <input type="number" className="input input-bordered w-full" value={editFields.waiverAmount} onChange={e => handleEditChange('waiverAmount', e.target.value)} />
              <input type="text" className="input input-bordered w-full mt-1" placeholder="Waiver Reason" value={editFields.waiverReason} onChange={e => handleEditChange('waiverReason', e.target.value)} />
            </div>
            <div className="mb-2">
              <label className="block font-semibold">Penalty Amount</label>
              <input type="number" className="input input-bordered w-full" value={editFields.penaltyAmount} onChange={e => handleEditChange('penaltyAmount', e.target.value)} />
              <input type="text" className="input input-bordered w-full mt-1" placeholder="Penalty Reason" value={editFields.penaltyReason} onChange={e => handleEditChange('penaltyReason', e.target.value)} />
            </div>
            <div className="mb-2">
              <label className="block font-semibold">Ad-hoc Charges</label>
              {adHocCharges.map((charge, i) => (
                <div key={i} className="border p-2 mb-2 rounded bg-gray-50">
                  <input type="text" className="input input-bordered w-full mb-1" placeholder="Label" value={charge.label} onChange={e => handleAdHocChange(i, 'label', e.target.value)} />
                  <input type="number" className="input input-bordered w-full mb-1" placeholder="Amount" value={charge.amount} onChange={e => handleAdHocChange(i, 'amount', e.target.value)} />
                  <input type="text" className="input input-bordered w-full mb-1" placeholder="Description" value={charge.description} onChange={e => handleAdHocChange(i, 'description', e.target.value)} />
                  <label className="inline-flex items-center"><input type="checkbox" checked={charge.isOneTime} onChange={e => handleAdHocChange(i, 'isOneTime', e.target.checked)} /> <span className="ml-1">One-time</span></label>
                  <Button size="sm" variant="outline" className="ml-2" onClick={() => removeAdHocCharge(i)}>Remove</Button>
                </div>
              ))}
              <Button size="sm" onClick={addAdHocCharge}>Add Ad-hoc Charge</Button>
            </div>
            {/* Approval history section */}
            {editingBill.approvalHistory && editingBill.approvalHistory.length > 0 && (
              <div className="mb-2">
                <label className="block font-semibold">Approval History</label>
                <ul className="text-xs bg-gray-100 p-2 rounded">
                  {editingBill.approvalHistory.map((h, i) => (
                    <li key={i}>{h.status} by {h.changedByName || h.changedBy} at {new Date(h.changedAt).toLocaleString()} {h.notes && <span>- {h.notes}</span>}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Button onClick={handleEditSave}>Save</Button>
              <Button variant="outline" onClick={handleEditCancel}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default BillManagementTable;

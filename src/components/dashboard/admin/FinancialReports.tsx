// src/components/dashboard/admin/FinancialReports.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export function FinancialReports({ societyId }: { societyId: string }) {
  const [bills, setBills] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    setLoading(true);
    const billUrl = `/api/billing/bills?societyId=${societyId}` + (period ? `&period=${period}` : '') + (userId ? `&userId=${userId}` : '');
    const paymentUrl = `/api/billing/payments?societyId=${societyId}` + (period ? `&period=${period}` : '') + (userId ? `&userId=${userId}` : '');
    const expenseUrl = `/api/billing/expenses?societyId=${societyId}` + (period ? `&period=${period}` : '');
    Promise.all([
      fetch(billUrl).then(res => res.json()),
      fetch(paymentUrl).then(res => res.json()),
      fetch(expenseUrl).then(res => res.json()),
    ]).then(([billData, paymentData, expenseData]) => {
      setBills(billData.bills || []);
      setPayments(paymentData.payments || []);
      setExpenses(expenseData.expenses || []);
    }).finally(() => setLoading(false));
  }, [societyId, period, userId]);

  // --- Compute live chart data ---
  const incomeByCategory = {
    labels: Array.from(new Set(bills.flatMap(b => b.breakdown ? Object.keys(b.breakdown) : []))),
    datasets: [{
      label: 'Income by Category',
      data: Array.from(new Set(bills.flatMap(b => b.breakdown ? Object.keys(b.breakdown) : []))).map(cat =>
        bills.reduce((sum, b) => sum + (b.breakdown?.[cat] || 0), 0)
      ),
      backgroundColor: ['#4f46e5', '#22d3ee', '#f59e42', '#f43f5e', '#22c55e', '#a21caf'],
    }],
  };
  const expensesByCategory = {
    labels: Array.from(new Set(expenses.map(e => e.category))),
    datasets: [{
      label: 'Expenses by Category',
      data: Array.from(new Set(expenses.map(e => e.category))).map(cat =>
        expenses.filter(e => e.category === cat).reduce((sum, e) => sum + (e.amount || 0), 0)
      ),
      backgroundColor: ['#f43f5e', '#f59e42', '#22d3ee', '#4f46e5', '#22c55e', '#a21caf'],
    }],
  };
  const outstandingByFlatType = {
    labels: Array.from(new Set(bills.map(b => b.flatType).filter(Boolean))),
    datasets: [{
      label: 'Outstanding Dues',
      data: Array.from(new Set(bills.map(b => b.flatType).filter(Boolean))).map(ft =>
        bills.filter(b => b.flatType === ft && (b.status === 'unpaid' || b.status === 'overdue')).reduce((sum, b) => sum + (b.amount || 0), 0)
      ),
      backgroundColor: ['#4f46e5', '#22d3ee', '#f59e42', '#f43f5e'],
    }],
  };
  const paymentStatusPie = {
    labels: ['Paid', 'Unpaid', 'Overdue', 'Partially Paid'],
    datasets: [{
      label: 'Payment Status',
      data: [
        bills.filter(b => b.status === 'paid').length,
        bills.filter(b => b.status === 'unpaid').length,
        bills.filter(b => b.status === 'overdue').length,
        bills.filter(b => b.status === 'partially_paid').length,
      ],
      backgroundColor: ['#22c55e', '#f59e42', '#f43f5e', '#a21caf'],
    }],
  };

  return (
    <Card className="shadow-lg mt-8">
      <CardHeader>
        <CardTitle>Financial Reports</CardTitle>
        <div className="flex gap-2 mt-2">
          <input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="input input-bordered w-36" placeholder="Period (YYYY-MM)" />
          <input type="text" value={userId} onChange={e => setUserId(e.target.value)} className="input input-bordered w-36" placeholder="User ID (optional)" />
        </div>
        <Button className="mt-2">Download Report</Button>
      </CardHeader>
      <CardContent>
        {loading ? <div>Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold mb-2">Income by Category</h3>
            <Bar data={incomeByCategory} options={{ plugins: { legend: { display: false } } }} />
          </div>
          <div>
            <h3 className="font-semibold mb-2">Expenses by Category</h3>
            <Bar data={expensesByCategory} options={{ plugins: { legend: { display: false } } }} />
          </div>
          <div>
            <h3 className="font-semibold mb-2">Outstanding Dues by Flat Type</h3>
            <Doughnut data={outstandingByFlatType} />
          </div>
          <div>
            <h3 className="font-semibold mb-2">Payment Status Distribution</h3>
            <Pie data={paymentStatusPie} />
          </div>
        </div>
        )}
        <div className="text-muted-foreground mt-8">
          <p>View and download reports of all bills, payments, and expenses for selected periods. Filter and analyze by category, flat type, payment status, and more.</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default FinancialReports;

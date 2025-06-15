// src/components/dashboard/admin/ExpenseEntryTable.tsx
'use client';
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import type { SocietyExpense } from '@/lib/types';
import jsPDF from 'jspdf';

// Dummy data for UI demo
const expenses: SocietyExpense[] = [
	{
		id: 'exp-001',
		societyId: 'society-001',
		category: 'Repairs',
		amount: 1200,
		expenseDate: '2025-06-10',
		description: 'Lift repair',
		createdByUserId: 'admin-001',
		createdAt: '2025-06-10T09:00:00Z',
	},
	{
		id: 'exp-002',
		societyId: 'society-001',
		category: 'Utilities',
		amount: 3500,
		expenseDate: '2025-06-05',
		description: 'Electricity bill',
		createdByUserId: 'admin-001',
		createdAt: '2025-06-05T09:00:00Z',
	},
];

export function ExpenseEntryTable() {
	// --- Export All Expenses as CSV ---
	const exportAllExpensesCSV = () => {
		if (!expenses.length) return;
		const headers = [
			'ID',
			'Category',
			'Amount',
			'Date',
			'Description',
			'Invoice',
			'Created By',
			'Created At',
		];
		const rows = expenses.map((e) => [
			e.id,
			e.category,
			e.amount,
			e.expenseDate,
			e.description,
			e.invoiceUrl,
			e.createdByUserId,
			e.createdAt,
		]);
		const csv = [headers, ...rows]
			.map((r) => r.map((x) => `"${x ?? ''}"`).join(','))
			.join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `all_expenses_export.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	// --- Export All Expenses as PDF ---
	const exportAllExpensesPDF = () => {
		if (!expenses.length) return;
		const doc = new jsPDF();
		doc.setFontSize(14);
		doc.text('All Expenses Export', 10, 15);
		let y = 25;
		expenses.forEach((e, idx) => {
			doc.setFontSize(11);
			doc.text(
				`Category: ${e.category} | Amount: ₹${e.amount} | Date: ${e.expenseDate}`,
				10,
				y
			);
			y += 7;
			if (e.description) {
				doc.text(`  Desc: ${e.description}`, 12, y);
				y += 6;
			}
			if (e.invoiceUrl) {
				doc.text(`  Invoice: ${e.invoiceUrl}`, 12, y);
				y += 6;
			}
			if (e.createdByUserId) {
				doc.text(`  By: ${e.createdByUserId}`, 12, y);
				y += 6;
			}
			y += 2;
			if (y > 270) {
				doc.addPage();
				y = 15;
			}
		});
		doc.save('all_expenses_export.pdf');
	};

	return (
		<Card className="shadow-lg mt-8">
			<CardHeader>
				<CardTitle>Society Expenses</CardTitle>
				<div className="flex gap-2 mt-2">
					<Button
						size="sm"
						variant="outline"
						onClick={exportAllExpensesCSV}
					>
						Export All (CSV)
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={exportAllExpensesPDF}
					>
						Export All (PDF)
					</Button>
					<Button className="mt-2">Add Expense</Button>
				</div>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Category</TableHead>
							<TableHead>Amount</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{expenses.map((exp) => (
							<TableRow key={exp.id}>
								<TableCell>{exp.category}</TableCell>
								<TableCell>₹{exp.amount}</TableCell>
								<TableCell>{exp.expenseDate}</TableCell>
								<TableCell>{exp.description}</TableCell>
								<TableCell>
									<Button size="sm" variant="outline">
										Edit
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

export default ExpenseEntryTable;

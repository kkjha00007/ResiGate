// src/app/api/billing/expenses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSocietyExpensesContainer } from '@/lib/cosmosdb';
import { SocietyExpense } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// GET: List expenses (with optional filters)
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const societyId = url.searchParams.get('societyId') || request.headers.get('x-society-id');
  const category = url.searchParams.get('category');
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }
  let query = 'SELECT * FROM c WHERE c.societyId = @societyId';
  const parameters: any[] = [{ name: '@societyId', value: societyId }];
  if (category) {
    query += ' AND c.category = @category';
    parameters.push({ name: '@category', value: category });
  }
  query += ' ORDER BY c.expenseDate DESC';
  try {
    const container = getSocietyExpensesContainer();
    const { resources } = await container.items.query({ query, parameters }).fetchAll();
    return NextResponse.json({ expenses: resources });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to fetch expenses', error: error.message }, { status: 500 });
  }
}

// POST: Create a new expense
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid or missing JSON body' }, { status: 400 });
  }
  const { societyId, category, amount, expenseDate, description, invoiceUrl, createdByUserId } = body;
  if (!societyId || !category || !amount || !expenseDate || !createdByUserId) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }
  const expense: SocietyExpense = {
    id: uuidv4(),
    societyId,
    category,
    amount,
    expenseDate,
    description,
    invoiceUrl,
    createdByUserId,
    createdAt: new Date().toISOString(),
  };
  try {
    const container = getSocietyExpensesContainer();
    await container.items.create(expense);
    return NextResponse.json({ message: 'Expense created', expense });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to create expense', error: error.message }, { status: 500 });
  }
}

// PUT: Update an expense
export async function PUT(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid or missing JSON body' }, { status: 400 });
  }
  const { id, societyId, ...updates } = body;
  if (!id || !societyId) {
    return NextResponse.json({ message: 'id and societyId are required' }, { status: 400 });
  }
  const container = getSocietyExpensesContainer();
  try {
    const { resource: existing } = await container.item(id, societyId).read<SocietyExpense>();
    if (!existing) {
      return NextResponse.json({ message: 'Expense not found' }, { status: 404 });
    }
    const updated = { ...existing, ...updates };
    await container.items.upsert(updated);
    return NextResponse.json({ message: 'Expense updated', expense: updated });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to update expense', error: error.message }, { status: 500 });
  }
}

// DELETE: Delete an expense
export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const societyId = url.searchParams.get('societyId');
  if (!id || !societyId) {
    return NextResponse.json({ message: 'id and societyId are required' }, { status: 400 });
  }
  const container = getSocietyExpensesContainer();
  try {
    await container.item(id, societyId).delete();
    return NextResponse.json({ message: 'Expense deleted' });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to delete expense', error: error.message }, { status: 500 });
  }
}

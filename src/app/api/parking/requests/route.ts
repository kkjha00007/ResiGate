// src/app/api/parking/requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { parkingRequestsContainer } from '@/lib/cosmosdb';
import type { ParkingRequest } from '@/lib/types';

// POST: Create a new parking request
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid or missing JSON body' }, { status: 400 });
  }
  const { userId, userName, flatNumber, societyId, type, vehicleNumber, notes } = body;
  if (!userId || !societyId || !type || !vehicleNumber) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }
  const newRequest: ParkingRequest = {
    id: crypto.randomUUID(),
    userId,
    userName,
    flatNumber,
    societyId,
    type,
    vehicleNumber,
    notes,
    status: 'pending',
    adminComment: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  try {
    await parkingRequestsContainer.items.create(newRequest);
    return NextResponse.json({ success: true, request: newRequest });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to create request' }, { status: 500 });
  }
}

// GET: List all requests for admin (optionally filter by status/society)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const societyId = searchParams.get('societyId');
  const status = searchParams.get('status');
  let query = `SELECT * FROM c`;
  const conditions = [];
  if (societyId) conditions.push(`c.societyId = @societyId`);
  if (status) conditions.push(`c.status = @status`);
  if (conditions.length > 0) query += ` WHERE ` + conditions.join(' AND ');
  const parameters = [];
  if (societyId) parameters.push({ name: '@societyId', value: societyId });
  if (status) parameters.push({ name: '@status', value: status });
  try {
    const { resources } = await parkingRequestsContainer.items.query({ query, parameters }).fetchAll();
    return NextResponse.json(resources);
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch requests' }, { status: 500 });
  }
}

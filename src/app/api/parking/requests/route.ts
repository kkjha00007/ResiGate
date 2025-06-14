// src/app/api/parking/requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getParkingRequestsContainer, getUsersContainer } from '@/lib/cosmosdb';
import { USER_ROLES } from '@/lib/constants';
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
  // ENFORCE: Only Owners, Society Admins, or Superadmins with a flat can submit parking allocation requests
  const usersContainer = getUsersContainer();
  const { resource: user } = await usersContainer.item(userId, societyId).read();
  const allowedRoles = [USER_ROLES.OWNER, USER_ROLES.SOCIETY_ADMIN, USER_ROLES.SUPERADMIN];
  if (!user || !allowedRoles.includes(user.role) || !user.flatNumber) {
    return NextResponse.json({ message: 'Only Owners or Admins with a flat can submit parking allocation requests.' }, { status: 400 });
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
  let parkingRequestsContainer;
  try {
    parkingRequestsContainer = getParkingRequestsContainer();
  } catch (err) {
    return NextResponse.json({ message: 'Cosmos DB connection is not configured.' }, { status: 500 });
  }
  try {
    await parkingRequestsContainer.items.create(newRequest);
    // Add vehicle to Owner's profile if not already present
    if (user) {
      const vehicleToAdd = {
        number: vehicleNumber,
        type,
        notes,
        addedAt: new Date().toISOString(),
      };
      let vehicles = Array.isArray(user.vehicles) ? user.vehicles : [];
      // Only add if not already present
      if (!(vehicles as any[]).some((v: any) => (v as { number: string }).number === vehicleNumber)) {
        vehicles.push(vehicleToAdd);
        await usersContainer.item(userId, societyId).replace({ ...user, vehicles });
      }
    }
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
  let parkingRequestsContainer;
  try {
    parkingRequestsContainer = getParkingRequestsContainer();
  } catch (err) {
    return NextResponse.json({ message: 'Cosmos DB connection is not configured.' }, { status: 500 });
  }
  try {
    const { resources } = await parkingRequestsContainer.items.query({ query, parameters }).fetchAll();
    return NextResponse.json(resources);
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch requests' }, { status: 500 });
  }
}

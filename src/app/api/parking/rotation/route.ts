// src/app/api/parking/rotation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getParkingSpotsContainer, getParkingRequestsContainer } from '@/lib/cosmosdb';
import { ParkingSpot } from '@/lib/types';
import { ParkingRotationHistory } from '@/lib/rotation-history';

// TODO: Replace with actual CosmosDB container for rotation history if needed
const rotationHistory: ParkingRotationHistory[] = [];

// POST: Trigger a parking rotation (admin only)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const societyId = body.societyId;
  const confirm = body.confirm || false;
  const now = new Date();
  if (!societyId) {
    return NextResponse.json({ message: 'societyId is required' }, { status: 400 });
  }

  // Fetch all queued requests older than 1 year
  const parkingRequestsContainer = getParkingRequestsContainer();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const { resources: queuedRequests } = await parkingRequestsContainer.items.query({
    query: 'SELECT * FROM c WHERE c.societyId = @societyId AND c.status = @status AND c.createdAt < @oneYearAgo',
    parameters: [
      { name: '@societyId', value: societyId },
      { name: '@status', value: 'queued' },
      { name: '@oneYearAgo', value: oneYearAgo.toISOString() },
    ],
  }).fetchAll();
  const rotationCount = queuedRequests.length;

  // Fetch all parking spots for the society
  const parkingSpotsContainer = getParkingSpotsContainer();
  const { resources: allSpots } = await parkingSpotsContainer.items.query({
    query: 'SELECT * FROM c WHERE c.societyId = @societyId',
    parameters: [{ name: '@societyId', value: societyId }],
  }).fetchAll();
  const allocated = allSpots.filter((s: ParkingSpot) => s.status === 'allocated');

  // Fairness: get last 2 years' deallocated userIds from rotation history
  // (Assume you have a way to fetch rotation history from DB, here we use in-memory for demo)
  const recentDeallocatedUserIds = new Set();
  for (const hist of rotationHistory.slice(-2)) {
    (hist.deallocatedUserIds || []).forEach(uid => recentDeallocatedUserIds.add(uid));
  }

  // Filter out users deallocated in last 2 years
  const eligibleAllocated = allocated.filter(s => s.allocatedToUserId && !recentDeallocatedUserIds.has(s.allocatedToUserId));
  // If not enough, fallback to all allocated
  const candidates = eligibleAllocated.length >= rotationCount ? eligibleAllocated : allocated;
  // Randomly select spots to deallocate
  const shuffled = candidates.sort(() => 0.5 - Math.random());
  const toDeallocate = shuffled.slice(0, rotationCount);

  // Prepare preview result
  const preview = {
    queuedRequests,
    toDeallocate: toDeallocate.map(s => ({
      spotId: s.id,
      spotNumber: s.spotNumber,
      allocatedToUserId: s.allocatedToUserId,
      allocatedToFlatNumber: s.allocatedToFlatNumber,
    })),
  };

  if (!confirm) {
    // Preview only, do not mutate DB
    return NextResponse.json({ preview });
  }

  // --- On confirmation, perform deallocation and allocation ---
  const freezeDurationDays = body.freezeDurationDays || 365;
  const freezeUntil = new Date(now.getTime() + freezeDurationDays * 24 * 60 * 60 * 1000).toISOString();
  const details: ParkingRotationHistory['details'] = [];

  // Deallocate
  for (const spot of toDeallocate) {
    await parkingSpotsContainer.item(spot.id, spot.societyId).replace({
      ...spot,
      status: 'available',
      allocatedToUserId: undefined,
      allocatedToFlatNumber: undefined,
      vehicleNumber: undefined,
      freezeUntil: null,
      lastAllocatedAt: spot.lastAllocatedAt || now.toISOString(),
      updatedAt: now.toISOString(),
    });
    details.push({ spotId: spot.id, fromUserId: spot.allocatedToUserId });
  }

  // Allocate: assign the deallocated spots to the queued requests
  for (let i = 0; i < toDeallocate.length; i++) {
    const spot = toDeallocate[i];
    const req = queuedRequests[i];
    if (!spot || !req) continue;
    await parkingSpotsContainer.item(spot.id, spot.societyId).replace({
      ...spot,
      status: 'allocated',
      allocatedToUserId: req.userId,
      allocatedToFlatNumber: req.flatNumber,
      vehicleNumber: req.vehicleNumber,
      freezeUntil,
      lastAllocatedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    details.push({ spotId: spot.id, toUserId: req.userId, freezeUntil });
    // Optionally, update the request status to 'approved'
    await parkingRequestsContainer.item(req.id, req.societyId).replace({ ...req, status: 'approved', updatedAt: now.toISOString() });
  }

  // Save rotation history (in-memory for now)
  const history: ParkingRotationHistory = {
    id: uuidv4(),
    societyId,
    date: now.toISOString(),
    deallocatedUserIds: toDeallocate.map(s => s.allocatedToUserId || ''),
    allocatedUserIds: toDeallocate.map((s, i) => queuedRequests[i]?.userId || ''),
    details,
  };
  rotationHistory.push(history);

  return NextResponse.json({ success: true, history });
}

// GET: Get rotation history (stub)
export async function GET(request: NextRequest) {
  // TODO: Replace with CosmosDB query
  return NextResponse.json(rotationHistory);
}

// src/app/api/parking/requests/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { parkingRequestsContainer, parkingSpotsContainer } from '@/lib/cosmosdb';
import type { ParkingRequest, ParkingSpot } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// PATCH: Admin update status/comment for a parking request
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid or missing JSON body' }, { status: 400 });
  }
  const { status, adminComment, societyId } = body;
  if (!status || !societyId) {
    return NextResponse.json({ message: 'Missing status or societyId' }, { status: 400 });
  }
  try {
    const { resource: req } = await parkingRequestsContainer.item(id, societyId).read<ParkingRequest>();
    if (!req) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }
    req.status = status;
    req.adminComment = adminComment || req.adminComment;
    req.updatedAt = new Date().toISOString();

    // If approved, assign a parking spot
    if (status === 'approved') {
      // Find available spot of requested type
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.societyId = @societyId AND c.status = @status AND c.type = @type',
        parameters: [
          { name: '@societyId', value: req.societyId },
          { name: '@status', value: 'available' },
          { name: '@type', value: req.type === 'both' ? 'car' : req.type }, // If 'both', prefer car
        ],
      };
      const { resources: availableSpots } = await parkingSpotsContainer.items.query(querySpec, { partitionKey: req.societyId }).fetchAll();
      if (availableSpots.length > 0) {
        const assignedSpot = availableSpots[0];
        // Update spot to allocated
        assignedSpot.status = 'allocated';
        assignedSpot.allocatedToUserId = req.userId;
        assignedSpot.allocatedToFlatNumber = req.flatNumber;
        assignedSpot.vehicleNumber = req.vehicleNumber;
        assignedSpot.updatedAt = new Date().toISOString();
        await parkingSpotsContainer.item(assignedSpot.id, assignedSpot.societyId).replace(assignedSpot);
      } else {
        // Optionally, create a new spot (here, we queue if none available)
        req.status = 'queued';
        req.adminComment = (req.adminComment || '') + ' | No available spot, request queued.';
        await parkingRequestsContainer.item(id, societyId).replace(req);
        return NextResponse.json({ success: true, queued: true, message: 'No available spot, request queued.' });
      }
    }
    await parkingRequestsContainer.item(id, societyId).replace(req);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update request' }, { status: 500 });
  }
}

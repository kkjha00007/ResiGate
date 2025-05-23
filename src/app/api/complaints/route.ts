
// src/app/api/complaints/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { complaintsContainer } from '@/lib/cosmosdb';
import type { Complaint, ComplaintCategory } from '@/lib/types';
import { COMPLAINT_STATUSES_VALUES } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// Submit a new complaint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
        userId, 
        userName, 
        userFlatNumber, 
        subject, 
        category, 
        description 
    } = body as Omit<Complaint, 'id' | 'submittedAt' | 'status'>;

    if (!userId || !userName || !userFlatNumber || !subject || !category || !description) {
      return NextResponse.json({ message: 'Missing required fields for complaint submission' }, { status: 400 });
    }

    const newComplaint: Complaint = {
      id: uuidv4(),
      userId,
      userName,
      userFlatNumber,
      subject,
      category: category as ComplaintCategory, // Ensure type safety
      description,
      submittedAt: new Date().toISOString(),
      status: COMPLAINT_STATUSES_VALUES.OPEN,
    };

    const { resource: createdComplaint } = await complaintsContainer.items.create(newComplaint);

    if (!createdComplaint) {
      return NextResponse.json({ message: 'Failed to submit complaint' }, { status: 500 });
    }

    return NextResponse.json(createdComplaint, { status: 201 });

  } catch (error) {
    console.error('Submit Complaint API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

// src/app/api/society-search/invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CosmosClient } from '@azure/cosmos';

const COSMOS_CONNECTION_STRING = process.env.COSMOS_CONNECTION_STRING!;
const client = new CosmosClient(COSMOS_CONNECTION_STRING);
const database = client.database('ResiGateDB');
const container = database.container('SocietyInvites');

export async function POST(request: NextRequest) {
  try {
    const { societyName, name, email, phone } = await request.json();
    if (!societyName || !name || !email) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    // Get IP address (Next.js API route)
    // Try to get a real public IP address (prefer first in x-forwarded-for if present)
    let ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    if (ip && ip.includes(',')) ip = ip.split(',')[0].trim();
    if (!ip || ip === '::1' || ip === '127.0.0.1') ip = '';
    const doc = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      societyName,
      contactName: name,
      contactEmail: email,
      contactPhone: phone || '',
      ip,
      createdAt: new Date().toISOString(),
    };
    await container.items.create(doc);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save invite' }, { status: 500 });
  }
}

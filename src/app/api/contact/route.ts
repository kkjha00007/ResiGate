// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CosmosClient } from '@azure/cosmos';

export async function POST(request: NextRequest) {
  const COSMOS_CONNECTION_STRING = process.env.COSMOS_CONNECTION_STRING;
  if (!COSMOS_CONNECTION_STRING) {
    return NextResponse.json({ error: 'Cosmos DB connection string is not configured in environment variables.' }, { status: 500 });
  }
  const client = new CosmosClient(COSMOS_CONNECTION_STRING);
  const database = client.database('ResiGateDB');
  const container = database.container('ContactMessages');
  try {
    const { name, email, message } = await request.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    // Get IP address (Next.js API route)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const doc = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      email,
      message,
      ip,
      createdAt: new Date().toISOString(),
    };
    await container.items.create(doc);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}

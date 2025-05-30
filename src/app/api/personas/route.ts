// src/app/api/personas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { personasContainer } from '@/lib/cosmosdb';
import type { Persona } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// GET: List all personas for a society
export async function GET(req: NextRequest) {
  const societyId = req.nextUrl.searchParams.get('societyId');
  if (!societyId) return NextResponse.json({ error: 'Missing societyId' }, { status: 400 });
  const query = {
    query: 'SELECT * FROM c WHERE c.societyId = @societyId',
    parameters: [{ name: '@societyId', value: societyId }],
  };
  const { resources } = await personasContainer.items.query(query).fetchAll();
  return NextResponse.json(resources);
}

// POST: Create a new persona
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.societyId || !body.name || !body.roleKeys) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const persona: Persona = {
    id: body.id || uuidv4(),
    societyId: body.societyId,
    name: body.name,
    description: body.description || '',
    roleKeys: body.roleKeys,
    featureAccess: body.featureAccess || {},
  };
  const { resource } = await personasContainer.items.create(persona);
  return NextResponse.json(resource, { status: 201 });
}

// PATCH: Update a persona
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  if (!body.id || !body.societyId) {
    return NextResponse.json({ error: 'Missing id or societyId' }, { status: 400 });
  }
  const { resource: existing } = await personasContainer.item(body.id, body.societyId).read();
  if (!existing) return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
  const updated = { ...existing, ...body };
  const { resource } = await personasContainer.items.upsert(updated);
  return NextResponse.json(resource);
}

// DELETE: Delete a persona
export async function DELETE(req: NextRequest) {
  const { id, societyId } = await req.json();
  if (!id || !societyId) return NextResponse.json({ error: 'Missing id or societyId' }, { status: 400 });
  await personasContainer.item(id, societyId).delete();
  return NextResponse.json({ success: true });
}

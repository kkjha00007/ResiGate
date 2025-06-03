// src/app/api/society-search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CosmosClient } from '@azure/cosmos';

const COSMOS_CONNECTION_STRING = process.env.COSMOS_CONNECTION_STRING!;
const client = new CosmosClient(COSMOS_CONNECTION_STRING);
const database = client.database('ResiGateDB');
const container = database.container('Societies');

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name')?.toLowerCase() || '';
  if (!name) return NextResponse.json({ results: [] });
  const query = {
    query: 'SELECT c.name FROM c WHERE LOWER(c.name) LIKE @name',
    parameters: [{ name: '@name', value: `%${name}%` }],
  };
  const { resources } = await container.items.query(query).fetchAll();
  const results = resources.map((r: any) => r.name);
  return NextResponse.json({ results });
}

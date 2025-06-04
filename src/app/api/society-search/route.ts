// src/app/api/society-search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CosmosClient } from '@azure/cosmos';

export async function GET(request: NextRequest) {
  const COSMOS_CONNECTION_STRING = process.env.COSMOS_CONNECTION_STRING;
  if (!COSMOS_CONNECTION_STRING) {
    return NextResponse.json(
      { error: 'Cosmos DB connection string is not set in environment variables.' },
      { status: 500 }
    );
  }
  const client = new CosmosClient(COSMOS_CONNECTION_STRING);
  const database = client.database('ResiGateDB');
  const container = database.container('Societies');

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

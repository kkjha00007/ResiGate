import { NextRequest, NextResponse } from 'next/server';
import { getVisitorEntriesContainer } from '@/lib/cosmosdb';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ message: 'Missing visitor entry id' }, { status: 400 });
  }
  let visitorEntriesContainer;
  try {
    visitorEntriesContainer = getVisitorEntriesContainer();
  } catch (err) {
    return NextResponse.json({ message: 'Cosmos DB connection is not configured.' }, { status: 500 });
  }
  try {
    // First, query for the entry by id to get its societyId
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: id }],
    };
    const { resources } = await visitorEntriesContainer.items.query(querySpec).fetchAll();
    const entry = resources[0];
    if (!entry) {
      return NextResponse.json({ message: 'Visitor entry not found' }, { status: 404 });
    }
    // Use the correct partition key (societyId)
    entry.status = 'denied';
    await visitorEntriesContainer.item(id, entry.societyId).replace(entry);
    return NextResponse.json({ message: 'Visitor entry denied', status: 'denied' });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to deny visitor entry' }, { status: 500 });
  }
}

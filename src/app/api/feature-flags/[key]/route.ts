import { NextRequest, NextResponse } from 'next/server';
import { getCosmosDB, featureFlagsContainerId } from '@/lib/cosmosdb';
import { FeatureFlag, FeatureFlagContainer } from '@/lib/types';

const CONTAINER_NAME = featureFlagsContainerId;

async function getFeatureFlagFromDB(key: string, societyId: string): Promise<FeatureFlag | null> {
  try {
    const { database } = getCosmosDB();
    const container = database.container(CONTAINER_NAME);
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.id = @key AND c.societyId = @societyId',
      parameters: [
        { name: '@key', value: key },
        { name: '@societyId', value: societyId }
      ]
    };
    const { resources } = await container.items.query<FeatureFlagContainer>(querySpec).fetchAll();
    if (resources.length > 0) {
      return resources[0].flag;
    }
    return null;
  } catch (error) {
    console.error('Error fetching feature flag from database:', error);
    return null;
  }
}

async function saveFeatureFlagToDB(flag: FeatureFlag, societyId: string): Promise<boolean> {
  try {
    if (!flag.platforms) flag.platforms = {};
    if (!flag.platforms.web) flag.platforms.web = { enabled: flag.enabled };
    if (!flag.platforms.mobile) flag.platforms.mobile = { enabled: flag.enabled };
    if (flag.roles && (!flag.platforms.web.roles || !flag.platforms.mobile.roles)) {
      flag.platforms.web.roles = flag.platforms.web.roles || { ...flag.roles };
      flag.platforms.mobile.roles = flag.platforms.mobile.roles || { ...flag.roles };
    }
    const { database } = getCosmosDB();
    const container = database.container(CONTAINER_NAME);
    const flagContainer: FeatureFlagContainer = {
      id: flag.key,
      societyId,
      flag
    };
    await container.items.upsert(flagContainer);
    return true;
  } catch (error) {
    console.error('Error saving feature flag to database:', error);
    return false;
  }
}

export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  const key = params.key;
  const societyId = request.nextUrl.searchParams.get('societyId') || 'global';
  const flag = await getFeatureFlagFromDB(key, societyId);
  if (!flag) {
    return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 });
  }
  return NextResponse.json(flag);
}

export async function PUT(request: NextRequest, { params }: { params: { key: string } }) {
  const key = params.key;
  const societyId = request.nextUrl.searchParams.get('societyId') || 'global';
  const body = await request.json();
  const flag = body.flag || body;
  if (!flag || !flag.key || flag.key !== key) {
    return NextResponse.json({ error: 'Invalid feature flag data' }, { status: 400 });
  }
  flag.updatedAt = new Date().toISOString();
  const success = await saveFeatureFlagToDB(flag, societyId);
  if (!success) {
    return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 });
  }
  return NextResponse.json({ success: true, flag });
}

export async function DELETE(request: NextRequest, { params }: { params: { key: string } }) {
  const key = params.key;
  const societyId = request.nextUrl.searchParams.get('societyId') || 'global';
  try {
    const { database } = getCosmosDB();
    const container = database.container(CONTAINER_NAME);
    await container.item(key, societyId).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting feature flag:', error);
    return NextResponse.json({ error: 'Failed to delete feature flag' }, { status: 500 });
  }
}

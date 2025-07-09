import { NextRequest, NextResponse } from 'next/server';
import { getCosmosDB, featureFlagsContainerId } from '@/lib/cosmosdb';
import { FeatureFlag, FeatureFlagContainer } from '@/lib/types';
import { FEATURES, FEATURE_TO_TIER, PRICING_TIERS } from '@/lib/constants';

const CONTAINER_NAME = featureFlagsContainerId;

/**
 * Get feature flag from database
 */
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

/**
 * Get all feature flags from database
 */
async function getAllFeatureFlagsFromDB(societyId: string): Promise<FeatureFlag[]> {
  try {
    const { database } = getCosmosDB();
    const container = database.container(CONTAINER_NAME);
    
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.societyId = @societyId',
      parameters: [{ name: '@societyId', value: societyId }]
    };
    
    const { resources } = await container.items.query<FeatureFlagContainer>(querySpec).fetchAll();
    
    // Always return flags with normalized platform structure
    return resources.map((item: FeatureFlagContainer) => {
      const flag = item.flag;
      if (!flag.platforms) flag.platforms = {};
      if (!flag.platforms.web) flag.platforms.web = { enabled: flag.enabled };
      if (!flag.platforms.mobile) flag.platforms.mobile = { enabled: flag.enabled };
      if (flag.roles && (!flag.platforms.web.roles || !flag.platforms.mobile.roles)) {
        flag.platforms.web.roles = flag.platforms.web.roles || { ...flag.roles };
        flag.platforms.mobile.roles = flag.platforms.mobile.roles || { ...flag.roles };
      }
      return flag;
    });
  } catch (error) {
    console.error('Error fetching feature flags from database:', error);
    return [];
  }
}

/**
 * Save feature flag to database
 */
async function saveFeatureFlagToDB(flag: FeatureFlag, societyId: string): Promise<boolean> {
  try {
    // --- Normalize platform-specific controls before saving ---
    if (!flag.platforms) {
      flag.platforms = {};
    }
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

/**
 * Create default feature flags for a society
 */
async function createDefaultFeatureFlags(societyId: string): Promise<FeatureFlag[]> {
  const defaultFlags: FeatureFlag[] = [];
  
  // Import role/group/platform constants
  // Import role/group/platform constants
  // Use require only for dynamic import in Node, but here we can import at top if needed
  // const { USER_ROLES } = require("@/lib/constants");
  // Instead, use already imported constants if possible
  const CRUD = ['Create', 'Read', 'Update', 'Delete'];
  // Build all roles list (as string[])
  const allRoles: string[] = Object.values(require("@/lib/constants").USER_ROLES);
  for (const [key, value] of Object.entries(FEATURES)) {
    // Set all permissions for all roles
    const webRoles: { [role: string]: boolean } = {};
    const mobileRoles: { [role: string]: boolean } = {};
    allRoles.forEach((role: string) => {
      webRoles[role] = true;
      mobileRoles[role] = true;
    });
    const flag: FeatureFlag = {
      key: value,
      name: key.replace(/_/g, ' ').toLowerCase(),
      description: `Default flag for ${key}`,
      enabled: true,
      platforms: {
        web: { enabled: true, roles: webRoles },
        mobile: { enabled: true, roles: mobileRoles },
      },
      environments: {
        dev: true,
        prod: true,
        demo: true,
      },
      roles: {}, // legacy/global
      tiers: {
        [FEATURE_TO_TIER[value as keyof typeof FEATURE_TO_TIER] || PRICING_TIERS.FREE]: true,
      },
      abTestConfig: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      modifiedBy: 'system',
    };
    defaultFlags.push(flag);
    await saveFeatureFlagToDB(flag, societyId);
  }
  
  return defaultFlags;
}

/**
 * GET /api/feature-flags - Get all feature flags
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const societyId = searchParams.get('societyId') || 'global';
    
    let flags = await getAllFeatureFlagsFromDB(societyId);
    
    // If no flags exist, create default ones
    if (flags.length === 0) {
      flags = await createDefaultFeatureFlags(societyId);
    }
    
    return NextResponse.json(flags);
  } catch (error) {
    console.error('Error in GET /api/feature-flags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature flags' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feature-flags - Create or update feature flag
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flag, societyId = 'global' } = body;
    
    if (!flag || !flag.key) {
      return NextResponse.json(
        { error: 'Invalid feature flag data' },
        { status: 400 }
      );
    }
    
    // Update timestamps
    const now = new Date().toISOString();
    flag.updatedAt = now;
    if (!flag.createdAt) {
      flag.createdAt = now;
    }
    
    const success = await saveFeatureFlagToDB(flag, societyId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save feature flag' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, flag });
  } catch (error) {
    console.error('Error in POST /api/feature-flags:', error);
    return NextResponse.json(
      { error: 'Failed to save feature flag' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/feature-flags/[key] - Update specific feature flag
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { flag, societyId = 'global' } = body;
    
    if (!flag || !flag.key) {
      return NextResponse.json(
        { error: 'Invalid feature flag data' },
        { status: 400 }
      );
    }
    
    // Update timestamp
    flag.updatedAt = new Date().toISOString();
    
    const success = await saveFeatureFlagToDB(flag, societyId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update feature flag' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, flag });
  } catch (error) {
    console.error('Error in PUT /api/feature-flags:', error);
    return NextResponse.json(
      { error: 'Failed to update feature flag' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/feature-flags/[key] - Delete feature flag
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');
    const societyId = searchParams.get('societyId') || 'global';
    
    if (!key) {
      return NextResponse.json(
        { error: 'Feature flag key is required' },
        { status: 400 }
      );
    }
    
    const { database } = getCosmosDB();
    const container = database.container(CONTAINER_NAME);
    
    await container.item(key, societyId).delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/feature-flags:', error);
    return NextResponse.json(
      { error: 'Failed to delete feature flag' },
      { status: 500 }
    );
  }
}

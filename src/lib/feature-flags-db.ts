/**
 * Database initialization script for Feature Flags
 * This script creates the FeatureFlags container if it doesn't exist
 * and sets up the necessary indexes for optimal performance
 */

import { getCosmosDB, featureFlagsContainerId } from '@/lib/cosmosdb';
import { FeatureFlag, FeatureFlagContainer } from '@/lib/types';
import { FEATURES, FEATURE_TO_TIER, PRICING_TIERS } from '@/lib/constants';

const PARTITION_KEY = '/societyId';

/**
 * Initialize Feature Flags container and create default flags
 */
export async function initializeFeatureFlags(societyId: string = 'global'): Promise<void> {
  try {
    const { database } = getCosmosDB();
    
    // Create container if it doesn't exist
    const containerDefinition = {
      id: featureFlagsContainerId,
      partitionKey: { paths: [PARTITION_KEY] },
      indexingPolicy: {
        automatic: true,
        indexingMode: 'consistent' as const,
        includedPaths: [
          {
            path: '/*',
            indexes: [
              {
                kind: 'Range' as const,
                dataType: 'String' as const,
                precision: -1,
              },
              {
                kind: 'Range' as const,
                dataType: 'Number' as const,
                precision: -1,
              },
            ],
          },
        ],
        excludedPaths: [
          {
            path: '/"_etag"/?',
          },
        ],
      },
      defaultTtl: -1, // No automatic expiration
    };

    const { container } = await database.containers.createIfNotExists(containerDefinition);
    
    console.log(`Feature Flags container '${featureFlagsContainerId}' initialized successfully`);
    
    // Check if default flags exist
    const querySpec = {
      query: 'SELECT COUNT(1) as count FROM c WHERE c.societyId = @societyId',
      parameters: [{ name: '@societyId', value: societyId }]
    };
    
    const { resources } = await container.items.query(querySpec).fetchAll();
    const existingCount = resources[0]?.count || 0;
    
    if (existingCount === 0) {
      console.log('Creating default feature flags...');
      await createDefaultFeatureFlags(societyId);
      console.log('Default feature flags created successfully');
    } else {
      console.log(`Found ${existingCount} existing feature flags for society ${societyId}`);
    }
    
  } catch (error) {
    console.error('Error initializing Feature Flags:', error);
    throw error;
  }
}

/**
 * Create default feature flags for a society
 */
async function createDefaultFeatureFlags(societyId: string): Promise<void> {
  try {
    const { database } = getCosmosDB();
    const container = database.container(featureFlagsContainerId);
    
    const defaultFlags: FeatureFlagContainer[] = [];
    
    // Create default flags for all features
    for (const [key, value] of Object.entries(FEATURES)) {
      const flag: FeatureFlag = {
        key: value,
        name: key.replace(/_/g, ' ').toLowerCase(),
        description: `Default flag for ${key}`,
        enabled: true,
        environments: {
          dev: true,
          prod: true,
          demo: true,
        },
        roles: {}, // Will be managed by RBAC
        tiers: {
          [FEATURE_TO_TIER[value as keyof typeof FEATURE_TO_TIER] || PRICING_TIERS.FREE]: true,
        },
        abTestConfig: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        modifiedBy: 'system',
      };
      
      const flagContainer: FeatureFlagContainer = {
        id: value,
        societyId,
        flag,
      };
      
      defaultFlags.push(flagContainer);
    }
    
    // Batch create all flags
    const promises = defaultFlags.map(flagContainer => 
      container.items.create(flagContainer)
    );
    
    await Promise.all(promises);
    
    console.log(`Created ${defaultFlags.length} default feature flags for society ${societyId}`);
    
  } catch (error) {
    console.error('Error creating default feature flags:', error);
    throw error;
  }
}

/**
 * Migrate existing feature flags to new schema (if needed)
 */
export async function migrateFeatureFlags(societyId: string): Promise<void> {
  try {
    const { database } = getCosmosDB();
    const container = database.container(featureFlagsContainerId);
    
    // Query all existing flags for migration
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.societyId = @societyId',
      parameters: [{ name: '@societyId', value: societyId }]
    };
    
    const { resources } = await container.items.query<FeatureFlagContainer>(querySpec).fetchAll();
    
    let migrationCount = 0;
    
    for (const item of resources) {
      let needsUpdate = false;
      const flag = item.flag;
      
      // Migration logic: ensure all flags have the new schema
      if (!flag.environments || typeof flag.environments !== 'object') {
        flag.environments = {
          dev: true,
          prod: true,
          demo: true,
        };
        needsUpdate = true;
      }
      
      if (!flag.roles || typeof flag.roles !== 'object') {
        flag.roles = {};
        needsUpdate = true;
      }
      
      if (!flag.tiers || typeof flag.tiers !== 'object') {
        flag.tiers = {
          [FEATURE_TO_TIER[flag.key as keyof typeof FEATURE_TO_TIER] || PRICING_TIERS.FREE]: true,
        };
        needsUpdate = true;
      }
      
      if (!flag.createdAt) {
        flag.createdAt = new Date().toISOString();
        needsUpdate = true;
      }
      
      if (!flag.updatedAt) {
        flag.updatedAt = new Date().toISOString();
        needsUpdate = true;
      }
      
      if (!flag.createdBy) {
        flag.createdBy = 'system';
        needsUpdate = true;
      }
      
      if (!flag.modifiedBy) {
        flag.modifiedBy = 'system';
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await container.items.upsert(item);
        migrationCount++;
      }
    }
    
    console.log(`Migrated ${migrationCount} feature flags for society ${societyId}`);
    
  } catch (error) {
    console.error('Error migrating feature flags:', error);
    throw error;
  }
}

/**
 * Create a new feature flag
 */
export async function createFeatureFlag(
  key: string,
  name: string,
  description: string,
  societyId: string,
  createdBy: string
): Promise<FeatureFlag> {
  try {
    const { database } = getCosmosDB();
    const container = database.container(featureFlagsContainerId);
    
    const flag: FeatureFlag = {
      key,
      name,
      description,
      enabled: true,
      environments: {
        dev: true,
        prod: true,
        demo: true,
      },
      roles: {},
      tiers: {
        [PRICING_TIERS.FREE]: true,
      },
      abTestConfig: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy,
      modifiedBy: createdBy,
    };
    
    const flagContainer: FeatureFlagContainer = {
      id: key,
      societyId,
      flag,
    };
    
    await container.items.create(flagContainer);
    
    return flag;
    
  } catch (error) {
    console.error('Error creating feature flag:', error);
    throw error;
  }
}

/**
 * Health check for feature flags system
 */
export async function healthCheckFeatureFlags(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  containerExists: boolean;
  flagCount: number;
}> {
  try {
    const { database } = getCosmosDB();
    
    // Check if container exists
    try {
      const container = database.container(featureFlagsContainerId);
      const { resources } = await container.items.query('SELECT COUNT(1) as count FROM c').fetchAll();
      const flagCount = resources[0]?.count || 0;
      
      return {
        status: 'healthy',
        message: `Feature flags system is healthy with ${flagCount} flags`,
        containerExists: true,
        flagCount,
      };
      
    } catch (containerError) {
      return {
        status: 'degraded',
        message: 'Feature flags container does not exist',
        containerExists: false,
        flagCount: 0,
      };
    }
    
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      status: 'unhealthy',
      message: `Feature flags system is unhealthy: ${error}`,
      containerExists: false,
      flagCount: 0,
    };
  }
}

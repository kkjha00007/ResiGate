import { 
  FeatureFlag, 
  FeatureContext, 
  Environment, 
  PricingTier,
  UserRole 
} from './types';
import { 
  FEATURES, 
  CURRENT_ENVIRONMENT, 
  FEATURE_TO_TIER, 
  PRICING_TIERS 
} from './constants';

/**
 * Feature Flag System - Modern, robust feature flag evaluation
 * Supports RBAC, environment-based, pricing tier, and A/B testing controls
 */

// In-memory cache for feature flags
let featureFlagCache: Map<string, FeatureFlag> = new Map();
let cacheExpiration = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Clear the feature flag cache
 */
export function clearFeatureFlagCache(): void {
  featureFlagCache.clear();
  cacheExpiration = 0;
}

/**
 * Get all feature flags from database with caching
 */
async function getFeatureFlags(): Promise<Map<string, FeatureFlag>> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (featureFlagCache.size > 0 && now < cacheExpiration) {
    return featureFlagCache;
  }

  try {
    const response = await fetch('/api/feature-flags', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const flags: FeatureFlag[] = await response.json();
    
    // Update cache
    featureFlagCache = new Map(flags.map(flag => [flag.key, flag]));
    cacheExpiration = now + CACHE_DURATION;
    
    return featureFlagCache;
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    
    // Return default flags if database is unavailable
    return getDefaultFeatureFlags();
  }
}

/**
 * Get default feature flags based on constants
 */
function getDefaultFeatureFlags(): Map<string, FeatureFlag> {
  const defaultFlags = new Map<string, FeatureFlag>();
  
  Object.values(FEATURES).forEach(key => {
    const flag: FeatureFlag = {
      key,
      name: key.replace(/_/g, ' ').toLowerCase(),
      description: `Default flag for ${key}`,
      enabled: true,
      environments: {
        [CURRENT_ENVIRONMENT]: true,
      },
      roles: {}, // Will be checked separately via RBAC
      tiers: {
        [FEATURE_TO_TIER[key as keyof typeof FEATURE_TO_TIER] || PRICING_TIERS.FREE]: true,
      },
      abTestConfig: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      modifiedBy: 'system',
    };
    
    defaultFlags.set(key, flag);
  });
  
  return defaultFlags;
}

/**
 * Check if user has access to a feature based on pricing tier
 */
function checkPricingTierAccess(
  feature: string, 
  context: FeatureContext
): boolean {
  if (!context.tier) return true; // No tier restriction
  
  const requiredTier = FEATURE_TO_TIER[feature as keyof typeof FEATURE_TO_TIER];
  if (!requiredTier) return true; // No tier requirement
  
  const tierHierarchy = {
    [PRICING_TIERS.FREE]: 0,
    [PRICING_TIERS.PREMIUM]: 1,
    [PRICING_TIERS.ENTERPRISE]: 2,
  };
  
  const userTierLevel = tierHierarchy[context.tier];
  const requiredTierLevel = tierHierarchy[requiredTier];
  
  return userTierLevel >= requiredTierLevel;
}

/**
 * Check if user is in A/B test group
 */
function checkABTestAccess(
  flag: FeatureFlag, 
  context: FeatureContext
): boolean {
  if (!flag.abTestConfig || !context.userId) return true;
  
  const { groups } = flag.abTestConfig;
  
  // Check if user has assigned A/B test group
  if (context.abTestGroups && context.abTestGroups[flag.key]) {
    const userGroup = context.abTestGroups[flag.key];
    const groupConfig = groups[userGroup];
    return groupConfig ? groupConfig.enabled : false;
  }
  
  // Auto-assign user to group based on hash
  const hash = simpleHash(context.userId + flag.key);
  const groupNames = Object.keys(groups);
  
  if (groupNames.length === 0) return true;
  
  let cumulative = 0;
  const userPercentage = (hash % 100) + 1;
  
  for (const groupName of groupNames) {
    const groupConfig = groups[groupName];
    cumulative += groupConfig.percentage;
    
    if (userPercentage <= cumulative) {
      return groupConfig.enabled;
    }
  }
  
  return false;
}

/**
 * Simple hash function for A/B testing
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Main feature flag evaluation function
 */
export async function isFeatureEnabled(
  featureKey: string,
  context: FeatureContext
): Promise<boolean> {
  try {
    const flags = await getFeatureFlags();
    const flag = flags.get(featureKey);
    
    if (!flag) {
      console.warn(`Feature flag not found: ${featureKey}`);
      return false;
    }
    
    // Check if flag is globally enabled
    if (!flag.enabled) {
      return false;
    }
    
    // Check environment-specific override
    if (flag.environments && flag.environments[context.environment] !== undefined) {
      if (!flag.environments[context.environment]) {
        return false;
      }
    }
    
    // Check role-specific override
    if (flag.roles && flag.roles[context.role] !== undefined) {
      if (!flag.roles[context.role]) {
        return false;
      }
    }
    
    // Check tier-specific override
    if (flag.tiers && flag.tiers[context.tier] !== undefined) {
      if (!flag.tiers[context.tier]) {
        return false;
      }
    } else {
      // Check default pricing tier access
      if (!checkPricingTierAccess(featureKey, context)) {
        return false;
      }
    }
    
    // Check A/B testing
    if (!checkABTestAccess(flag, context)) {
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error(`Error evaluating feature flag ${featureKey}:`, error);
    return false;
  }
}

/**
 * Get feature flag details
 */
export async function getFeatureFlag(featureKey: string): Promise<FeatureFlag | null> {
  try {
    const flags = await getFeatureFlags();
    return flags.get(featureKey) || null;
  } catch (error) {
    console.error(`Error getting feature flag ${featureKey}:`, error);
    return null;
  }
}

/**
 * Get all feature flags
 */
export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  try {
    const flags = await getFeatureFlags();
    return Array.from(flags.values());
  } catch (error) {
    console.error('Error getting all feature flags:', error);
    return [];
  }
}

/**
 * Bulk evaluate multiple features
 */
export async function evaluateFeatures(
  featureKeys: string[],
  context: FeatureContext
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  
  await Promise.all(
    featureKeys.map(async (key) => {
      results[key] = await isFeatureEnabled(key, context);
    })
  );
  
  return results;
}

/**
 * Server-side helper to create feature context from user and environment
 */
export function createFeatureContext(
  user: { id: string; primaryRole: UserRole; pricingTier?: PricingTier; abTestGroups?: { [key: string]: string } },
  environment: Environment = CURRENT_ENVIRONMENT,
  societyId?: string
): FeatureContext {
  return {
    userId: user.id,
    role: user.primaryRole,
    tier: user.pricingTier || PRICING_TIERS.FREE,
    environment,
    societyId,
    abTestGroups: user.abTestGroups,
  };
}

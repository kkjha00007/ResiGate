/**
 * Test script for Feature Flags System
 * Run this to test the feature flag evaluation
 */

import { isFeatureEnabled, createFeatureContext, clearFeatureFlagCache } from '@/lib/feature-flags';
import { FEATURES, PRICING_TIERS, ENVIRONMENTS } from '@/lib/constants';

// Test user contexts
const testUsers = [
  {
    id: '1',
    primaryRole: 'society_admin' as const,
    pricingTier: 'free' as const,
  },
  {
    id: '2',
    primaryRole: 'owner_resident' as const,
    pricingTier: 'premium' as const,
  },
  {
    id: '3',
    primaryRole: 'owner_app' as const,
    pricingTier: 'enterprise' as const,
  },
];

async function testFeatureFlags() {
  console.log('🧪 Testing Feature Flags System...\n');
  
  // Clear cache to get fresh data
  clearFeatureFlagCache();
  
  // Test each user context
  for (const user of testUsers) {
    console.log(`👤 Testing user: ${user.id} (${user.primaryRole}, ${user.pricingTier})`);
    
    const context = createFeatureContext(user, 'dev');
    
    // Test some key features
    const testFeatures = [
      FEATURES.VISITOR_MANAGEMENT,
      FEATURES.BILLING_MANAGEMENT,
      FEATURES.USER_MANAGEMENT,
      FEATURES.IMPERSONATION,
    ];
    
    for (const feature of testFeatures) {
      try {
        const enabled = await isFeatureEnabled(feature, context);
        console.log(`  ✓ ${feature}: ${enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
      } catch (error) {
        console.log(`  ❌ ${feature}: ERROR - ${error}`);
      }
    }
    
    console.log('');
  }
  
  console.log('✅ Feature Flags System test completed!');
}

// Export for use in other files
export { testFeatureFlags };

// Run test if this file is executed directly
if (typeof window === 'undefined') {
  // Server-side test
  testFeatureFlags().catch(console.error);
}

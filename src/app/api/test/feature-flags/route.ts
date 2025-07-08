/**
 * Feature Flags System Test
 * This file tests the feature flags functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { healthCheckFeatureFlags, initializeFeatureFlags } from '@/lib/feature-flags-db';
import { isFeatureEnabled, createFeatureContext, getAllFeatureFlags } from '@/lib/feature-flags';
import { FEATURES, PRICING_TIERS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Starting Feature Flags System Test...');
    
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const health = await healthCheckFeatureFlags();
    console.log('Health check result:', health);
    
    // Test 2: Initialize System
    console.log('2. Testing system initialization...');
    try {
      await initializeFeatureFlags('test-society');
      console.log('✅ System initialized successfully');
    } catch (error) {
      console.log('⚠️ System initialization:', error);
    }
    
    // Test 3: Get all feature flags
    console.log('3. Testing get all feature flags...');
    const allFlags = await getAllFeatureFlags();
    console.log(`Found ${allFlags.length} feature flags`);
    
    // Test 4: Feature evaluation
    console.log('4. Testing feature evaluation...');
    
    // Test different user contexts
    const testUsers = [
      {
        id: 'user1',
        primaryRole: 'society_admin' as const,
        pricingTier: 'free' as const,
      },
      {
        id: 'user2',
        primaryRole: 'owner_resident' as const,
        pricingTier: 'premium' as const,
      },
      {
        id: 'user3',
        primaryRole: 'owner_app' as const,
        pricingTier: 'enterprise' as const,
      },
    ];
    
    const testResults = [];
    
    for (const user of testUsers) {
      const context = createFeatureContext(user, 'dev');
      const userResults = {
        user: user.primaryRole,
        tier: user.pricingTier,
        features: {} as Record<string, boolean>,
      };
      
      // Test key features
      const testFeatures = [
        FEATURES.VISITOR_MANAGEMENT,
        FEATURES.BILLING_MANAGEMENT,
        FEATURES.USER_MANAGEMENT,
      ];
      
      for (const feature of testFeatures) {
        try {
          const enabled = await isFeatureEnabled(feature, context);
          userResults.features[feature] = enabled;
          console.log(`  ${user.primaryRole} (${user.pricingTier}): ${feature} = ${enabled ? '✅' : '❌'}`);
        } catch (error) {
          console.log(`  ${user.primaryRole} (${user.pricingTier}): ${feature} = ERROR: ${error}`);
          userResults.features[feature] = false;
        }
      }
      
      testResults.push(userResults);
    }
    
    console.log('✅ Feature Flags System Test Completed!');
    
    return NextResponse.json({
      success: true,
      message: 'Feature flags system test completed',
      results: {
        health,
        flagCount: allFlags.length,
        testResults,
      }
    });
    
  } catch (error) {
    console.error('❌ Feature Flags System Test Failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Feature flags system test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

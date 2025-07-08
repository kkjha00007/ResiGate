import { NextRequest, NextResponse } from 'next/server';
import { healthCheckFeatureFlags, initializeFeatureFlags } from '@/lib/feature-flags-db';

/**
 * GET /api/feature-flags/health - Health check for feature flags system
 */
export async function GET(request: NextRequest) {
  try {
    const health = await healthCheckFeatureFlags();
    return NextResponse.json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        message: 'Health check failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feature-flags/health - Initialize feature flags system
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { societyId = 'global' } = body;
    
    await initializeFeatureFlags(societyId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Feature flags system initialized successfully' 
    });
  } catch (error) {
    console.error('Initialization failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to initialize feature flags system', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

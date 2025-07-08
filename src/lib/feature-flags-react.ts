'use client';

import React, { useState, useEffect } from 'react';
import { FeatureContext } from './types';
import { isFeatureEnabled } from './feature-flags';

/**
 * React hook for feature flags (client-side)
 */
export function useFeatureFlag(
  featureKey: string,
  context: FeatureContext
): { enabled: boolean; loading: boolean; error: string | null } {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let mounted = true;
    
    isFeatureEnabled(featureKey, context)
      .then((result) => {
        if (mounted) {
          setEnabled(result);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message);
          setEnabled(false);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    
    return () => {
      mounted = false;
    };
  }, [featureKey, context]);
  
  return { enabled, loading, error };
}

/**
 * Feature flag component wrapper
 */
export function FeatureFlag({
  feature,
  context,
  children,
  fallback = null,
}: {
  feature: string;
  context: FeatureContext;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { enabled, loading } = useFeatureFlag(feature, context);
  
  if (loading) {
    return fallback as React.ReactElement;
  }
  
  return enabled ? (children as React.ReactElement) : (fallback as React.ReactElement);
}

/**
 * Higher-order component for feature flags
 */
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  featureKey: string,
  FallbackComponent?: React.ComponentType<P>
) {
  return function FeatureWrappedComponent(props: P & { featureContext: FeatureContext }) {
    const { featureContext, ...componentProps } = props;
    const { enabled, loading } = useFeatureFlag(featureKey, featureContext);
    
    if (loading) {
      return FallbackComponent ? React.createElement(FallbackComponent, componentProps as P) : null;
    }
    
    return enabled ? React.createElement(Component, componentProps as P) : 
      (FallbackComponent ? React.createElement(FallbackComponent, componentProps as P) : null);
  };
}

/**
 * Bulk feature flag hook for multiple features
 */
export function useFeatureFlags(
  featureKeys: string[],
  context: FeatureContext
): { flags: Record<string, boolean>; loading: boolean; error: string | null } {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let mounted = true;
    
    Promise.all(
      featureKeys.map(async (key) => {
        const enabled = await isFeatureEnabled(key, context);
        return { key, enabled };
      })
    )
      .then((results) => {
        if (mounted) {
          const flagsMap = results.reduce((acc, { key, enabled }) => {
            acc[key] = enabled;
            return acc;
          }, {} as Record<string, boolean>);
          
          setFlags(flagsMap);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message);
          setFlags({});
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    
    return () => {
      mounted = false;
    };
  }, [featureKeys, context]);
  
  return { flags, loading, error };
}

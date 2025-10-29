/**
 * Feature Flag and Kill-Switch Sync (F-15)
 *
 * Runtime feature flag and read-only mode synchronization.
 * Fetches `/config` endpoint, hides analytics when disabled,
 * surfaces read-only banner during maintenance.
 *
 * Per TDD Sections 13.5 & 13.8, supports:
 * - Runtime feature flag toggles (FEATURE_SOCIAL_FEED, FEATURE_INSIGHTS, etc.)
 * - Read-only kill-switch for emergency maintenance
 * - Automatic polling for configuration changes
 *
 * @see apps/docs/2*.Technical_Design_Document*.md Sections 13.5 & 13.8
 * @see CLAUDE.md - Feature Flags
 */

import { useEffect, useState } from "react";
import { apiClient } from "../services/api";

export interface FeatureFlags {
  socialFeed: boolean;
  coachDashboard: boolean;
  insights: boolean;
  [key: string]: boolean;
}

export interface SystemConfig {
  readOnlyMode: boolean;
  maintenanceMessage?: string;
  features: FeatureFlags;
  timestamp: string;
}

const DEFAULT_CONFIG: SystemConfig = {
  readOnlyMode: false,
  features: {
    socialFeed: false,
    coachDashboard: false,
    insights: false,
  },
  timestamp: new Date().toISOString(),
};

let cachedConfig: SystemConfig = DEFAULT_CONFIG;
let lastFetchTime = 0;
const CACHE_TTL = 60_000; // 1 minute

/**
 * Fetch system configuration from backend
 *
 * @returns System configuration with feature flags and read-only status
 */
export async function fetchSystemConfig(): Promise<SystemConfig> {
  try {
    const response = await apiClient.get<SystemConfig>("/api/v1/system/config");
    cachedConfig = response.data;
    lastFetchTime = Date.now();
    return cachedConfig;
  } catch (error) {
    console.warn("[featureFlags] Failed to fetch config, using cached/default", error);
    return cachedConfig;
  }
}

/**
 * Get cached system configuration
 *
 * @param forceRefresh - Force fetch from server even if cache is fresh
 * @returns System configuration
 */
export async function getSystemConfig(forceRefresh = false): Promise<SystemConfig> {
  const isCacheStale = Date.now() - lastFetchTime > CACHE_TTL;

  if (forceRefresh || isCacheStale) {
    return fetchSystemConfig();
  }

  return cachedConfig;
}

/**
 * Check if a specific feature is enabled
 *
 * @param featureName - Feature flag name
 * @returns True if feature is enabled
 */
export function isFeatureEnabled(featureName: keyof FeatureFlags): boolean {
  return cachedConfig.features[featureName] ?? false;
}

/**
 * React hook for accessing system configuration
 *
 * Automatically polls for updates every minute.
 *
 * @param pollInterval - Polling interval in milliseconds (default: 60s)
 * @returns System configuration and loading state
 *
 * @example
 * const { config, isLoading, refresh } = useSystemConfig();
 *
 * if (config.readOnlyMode) {
 *   return <MaintenanceBanner message={config.maintenanceMessage} />;
 * }
 *
 * {config.features.insights && <AnalyticsPanel />}
 */
export function useSystemConfig(pollInterval = 60_000) {
  const [config, setConfig] = useState<SystemConfig>(cachedConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const freshConfig = await fetchSystemConfig();
      setConfig(freshConfig);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch config"));
      setConfig(cachedConfig); // Fallback to cache
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    void refresh();

    // Set up polling
    const interval = setInterval(() => {
      void refresh();
    }, pollInterval);

    return () => {
      clearInterval(interval);
    };
  }, [pollInterval]);

  return { config, isLoading, error, refresh };
}

/**
 * React hook for checking a specific feature flag
 *
 * @param featureName - Feature flag name
 * @returns Feature enabled state
 *
 * @example
 * const insightsEnabled = useFeatureFlag('insights');
 *
 * if (!insightsEnabled) {
 *   return <UpgradePrompt />;
 * }
 */
export function useFeatureFlag(featureName: keyof FeatureFlags): boolean {
  const { config } = useSystemConfig();
  return config.features[featureName] ?? false;
}

/**
 * React hook for read-only mode status
 *
 * @returns Read-only mode state and maintenance message
 *
 * @example
 * const { readOnlyMode, message } = useReadOnlyMode();
 *
 * if (readOnlyMode) {
 *   return (
 *     <div className="maintenance-banner">
 *       {message || 'System is in maintenance mode'}
 *     </div>
 *   );
 * }
 */
export function useReadOnlyMode() {
  const { config } = useSystemConfig();

  return {
    readOnlyMode: config.readOnlyMode,
    message: config.maintenanceMessage,
  };
}

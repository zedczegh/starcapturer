
import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage data refresh logic for location details
 * Tracks refresh status and prevents redundant refreshes
 */
export const useRefreshManager = (locationData: any) => {
  const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'pending' | 'complete'>('idle');

  // Reset status when location changes
  useEffect(() => {
    if (locationData?.id) {
      setRefreshStatus('idle');
    }
  }, [locationData?.id]);

  // Check if a refresh is needed based on time since last refresh
  const shouldRefresh = useCallback(() => {
    // Don't refresh if one is already in progress
    if (refreshStatus === 'pending') {
      return false;
    }

    // Always refresh if we've never refreshed before
    if (lastRefreshTime === null) {
      return true;
    }

    // Check if enough time has passed since last refresh (5 minutes)
    const timeSinceLastRefresh = Date.now() - lastRefreshTime;
    const refreshInterval = 5 * 60 * 1000; // 5 minutes
    
    return timeSinceLastRefresh > refreshInterval;
  }, [lastRefreshTime, refreshStatus]);

  // Mark refresh as started
  const startRefresh = useCallback(() => {
    if (refreshStatus !== 'pending') {
      setRefreshStatus('pending');
    }
  }, [refreshStatus]);

  // Mark refresh as complete
  const markRefreshComplete = useCallback(() => {
    setLastRefreshTime(Date.now());
    setRefreshStatus('complete');
    setRefreshCount(prev => prev + 1);
  }, []);

  // Force a refresh regardless of timing
  const forceRefresh = useCallback(() => {
    setRefreshStatus('idle');
    return true;
  }, []);

  return {
    shouldRefresh,
    startRefresh,
    markRefreshComplete,
    forceRefresh,
    refreshStatus,
    refreshCount,
    lastRefreshTime
  };
};

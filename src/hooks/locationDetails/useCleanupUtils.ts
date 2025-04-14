
import { useCallback } from 'react';

export const useCleanupUtils = () => {
  // Clean up function to abort ongoing requests
  const cleanupRequest = useCallback((controllerRef: React.MutableRefObject<AbortController | null>) => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);
  
  // Cleanup timeout function
  const cleanupTimeout = useCallback((timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  return { cleanupRequest, cleanupTimeout };
};

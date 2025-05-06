
import { useCallback } from 'react';

export function useCleanupUtils() {
  // Cleanup utility for AbortController references
  const cleanupRequest = useCallback((controllerRef: React.MutableRefObject<AbortController | null>) => {
    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
      } catch (e) {
        console.error("Error aborting request:", e);
      }
      controllerRef.current = null;
    }
  }, []);

  // Cleanup utility for timeout references
  const cleanupTimeout = useCallback((timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  return { cleanupRequest, cleanupTimeout };
}

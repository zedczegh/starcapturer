
import { useEffect } from 'react';

interface UseExpandSearchRadiusProps {
  onRefresh?: () => void;
}

/**
 * Hook to listen for expand-search-radius events
 */
export const useExpandSearchRadius = ({
  onRefresh
}: UseExpandSearchRadiusProps) => {
  useEffect(() => {
    const handleExpandSearchRadius = (event: Event) => {
      // Parse the event detail
      const customEvent = event as CustomEvent<{ radius: number }>;
      console.log('Expand search radius event detected:', customEvent.detail);
      
      if (onRefresh) {
        console.log('Triggering refresh');
        onRefresh();
      }
    };
    
    // Add event listener
    document.addEventListener('expand-search-radius', handleExpandSearchRadius);
    
    // Cleanup
    return () => {
      document.removeEventListener('expand-search-radius', handleExpandSearchRadius);
    };
  }, [onRefresh]);
};

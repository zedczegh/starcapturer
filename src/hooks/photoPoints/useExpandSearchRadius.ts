
import { useEffect } from 'react';

interface UseExpandSearchRadiusProps {
  onRefresh?: () => void;
}

/**
 * Hook to handle the expand-search-radius event
 */
export function useExpandSearchRadius({ onRefresh }: UseExpandSearchRadiusProps) {
  useEffect(() => {
    const handleExpandRadius = (e: CustomEvent<{ radius: number }>) => {
      if (onRefresh) {
        document.dispatchEvent(new CustomEvent('set-search-radius', { 
          detail: { radius: e.detail.radius } 
        }));
        setTimeout(onRefresh, 100);
      }
    };
    
    document.addEventListener('expand-search-radius', handleExpandRadius as EventListener);
    
    return () => {
      document.removeEventListener('expand-search-radius', handleExpandRadius as EventListener);
    };
  }, [onRefresh]);
}

export default useExpandSearchRadius;

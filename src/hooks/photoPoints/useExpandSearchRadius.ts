
import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface UseExpandSearchRadiusProps {
  onRefresh?: () => void;
  currentRadius: number;
  maxRadius?: number;
  setRadius?: (radius: number) => void;
}

/**
 * Enhanced hook to handle the expand-search-radius event with smarter behavior
 */
export function useExpandSearchRadius({
  onRefresh,
  currentRadius,
  maxRadius = 10000,
  setRadius
}: UseExpandSearchRadiusProps) {
  const { language } = useLanguage();
  
  // Intelligent radius expansion calculation
  const calculateOptimalRadius = useCallback((currentRadius: number): number => {
    // For smaller radii, increase by larger percentages
    if (currentRadius < 500) {
      return Math.min(maxRadius, Math.ceil(currentRadius * 2));
    } 
    // For medium radii, increase by moderate amount
    else if (currentRadius < 2000) {
      return Math.min(maxRadius, Math.ceil(currentRadius * 1.5));
    }
    // For larger radii, use smaller increments
    else {
      return Math.min(maxRadius, Math.ceil(currentRadius * 1.25));
    }
  }, [maxRadius]);

  // Handle expand radius event
  useEffect(() => {
    const handleExpandRadius = (e: CustomEvent<{ radius?: number }>) => {
      const requestedRadius = e.detail.radius;
      
      // If a specific radius is requested, use it (within bounds)
      const newRadius = requestedRadius 
        ? Math.min(maxRadius, requestedRadius) 
        : calculateOptimalRadius(currentRadius);
      
      if (newRadius > currentRadius) {
        // Notify about radius expansion
        toast.info(
          language === 'en'
            ? `Expanding search radius to ${newRadius}km`
            : `将搜索半径扩大到${newRadius}公里`,
          { duration: 3000 }
        );
        
        // Update application state
        if (setRadius) {
          setRadius(newRadius);
        }
        
        document.dispatchEvent(new CustomEvent('set-search-radius', { 
          detail: { radius: newRadius } 
        }));
        
        // Trigger refresh with slight delay to allow state updates
        if (onRefresh) {
          setTimeout(onRefresh, 100);
        }
      }
    };
    
    document.addEventListener('expand-search-radius', handleExpandRadius as EventListener);
    
    return () => {
      document.removeEventListener('expand-search-radius', handleExpandRadius as EventListener);
    };
  }, [onRefresh, currentRadius, maxRadius, calculateOptimalRadius, setRadius, language]);
}

export default useExpandSearchRadius;

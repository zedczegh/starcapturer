
import { useEffect, useCallback, useRef } from 'react';
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
 * and optimized performance
 */
export function useExpandSearchRadius({
  onRefresh,
  currentRadius,
  maxRadius = 10000,
  setRadius
}: UseExpandSearchRadiusProps) {
  const { language } = useLanguage();
  const lastRadiusRef = useRef<number>(currentRadius);
  const expansionInProgressRef = useRef<boolean>(false);
  const expansionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clear any pending timers on unmount
  useEffect(() => {
    return () => {
      if (expansionTimerRef.current) {
        clearTimeout(expansionTimerRef.current);
      }
    };
  }, []);
  
  // Intelligent radius expansion calculation - optimized with memoization
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

  // Handle expand radius event with debouncing and duplicate prevention
  useEffect(() => {
    const handleExpandRadius = (e: CustomEvent<{ radius?: number }>) => {
      // Prevent duplicate expansions in rapid succession
      if (expansionInProgressRef.current) {
        return;
      }
      
      const requestedRadius = e.detail.radius;
      
      // If a specific radius is requested, use it (within bounds)
      const newRadius = requestedRadius 
        ? Math.min(maxRadius, requestedRadius) 
        : calculateOptimalRadius(currentRadius);
      
      // Only proceed if the new radius is greater than the current one
      // and different from the last expansion we processed
      if (newRadius > currentRadius && newRadius !== lastRadiusRef.current) {
        // Mark expansion as in progress to prevent duplicates
        expansionInProgressRef.current = true;
        lastRadiusRef.current = newRadius;
        
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
        
        // Dispatch event with slight delay to prevent event loops
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('set-search-radius', { 
            detail: { radius: newRadius } 
          }));
        }, 10);
        
        // Trigger refresh with slight delay to allow state updates
        if (onRefresh) {
          if (expansionTimerRef.current) {
            clearTimeout(expansionTimerRef.current);
          }
          
          expansionTimerRef.current = setTimeout(() => {
            onRefresh();
            // Reset expansion flag after refresh completes
            expansionInProgressRef.current = false;
            expansionTimerRef.current = null;
          }, 100);
        } else {
          // If no refresh function, still reset the flag
          setTimeout(() => {
            expansionInProgressRef.current = false;
          }, 200);
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

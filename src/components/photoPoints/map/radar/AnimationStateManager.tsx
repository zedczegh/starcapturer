import { useState, useEffect, useRef } from 'react';
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';

interface AnimationStateProps {
  isScanning: boolean;
  onStateChange?: (isVisible: boolean) => void;
}

/**
 * Custom hook to manage animation visibility state
 */
export const useAnimationState = ({ 
  isScanning, 
  onStateChange 
}: AnimationStateProps) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const visibilityTimeoutRef = useRef<number | null>(null);
  const { t } = useLanguage();
  
  // Handle animation visibility state
  useEffect(() => {
    // When scanning starts, immediately show animation
    if (isScanning) {
      setShowAnimation(true);
      if (onStateChange) onStateChange(true);
      
      // Clear any existing timeout
      if (visibilityTimeoutRef.current) {
        window.clearTimeout(visibilityTimeoutRef.current);
        visibilityTimeoutRef.current = null;
      }
      
      // Initial notification
      toast.info(t(
        "Scanning for locations within radius...",
        "正在扫描半径内的位置..."
      ));
    } else if (showAnimation) {
      // When scanning stops, keep animation visible for a while
      if (visibilityTimeoutRef.current) {
        window.clearTimeout(visibilityTimeoutRef.current);
      }
      
      // Keep animation visible for 10 seconds after scanning completes
      visibilityTimeoutRef.current = window.setTimeout(() => {
        setShowAnimation(false);
        if (onStateChange) onStateChange(false);
        visibilityTimeoutRef.current = null;
      }, 10000); // Increased from 6s to 10s as per request
    }
    
    return () => {
      if (visibilityTimeoutRef.current) {
        window.clearTimeout(visibilityTimeoutRef.current);
        visibilityTimeoutRef.current = null;
      }
    };
  }, [isScanning, showAnimation, t, onStateChange]);
  
  return { showAnimation };
};

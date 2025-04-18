
import { useCallback, useRef } from 'react';

export const useThrottle = (duration: number = 1000) => {
  const isThrottled = useRef(false);
  
  const throttle = useCallback((callback: Function) => {
    if (isThrottled.current) return false;
    
    isThrottled.current = true;
    setTimeout(() => {
      isThrottled.current = false;
    }, duration);
    
    callback();
    return true;
  }, [duration]);
  
  return throttle;
};

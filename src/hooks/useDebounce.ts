
import { useEffect, useRef, useState } from 'react';
import useEnhancedDebounce from './useEnhancedDebounce';

/**
 * A hook that debounces a value by delaying updates until after a specific delay
 * This helps reduce the number of calculations, API calls, and renders
 * 
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
function useDebounce<T>(value: T, delay: number = 500): T {
  return useEnhancedDebounce(value, delay, {
    shortDelay: 10,
    mediumDelay: 20,
    longDelay: 80,
    inputBasedTiming: true
  });
}

/**
 * A utility that creates a debounced function
 * This is useful when you need to debounce a callback function rather than a value
 * 
 * @param fn The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the function
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 500
): T => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const debouncedFn = useRef((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      fn(...args);
      timeoutRef.current = null;
    }, delay);
  }).current as T;
  
  return debouncedFn;
};

export default useDebounce;

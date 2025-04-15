
import { useEffect, useState, useRef } from 'react';

interface DebounceOptions {
  shortDelay?: number;   // Delay for short inputs
  mediumDelay?: number;  // Delay for medium inputs
  longDelay?: number;    // Delay for longer inputs
  immediate?: boolean;   // Whether to execute immediately on first change
  inputBasedTiming?: boolean; // Whether to adjust timing based on input length
}

/**
 * Enhanced debounce hook with dynamic timing options and performance optimizations
 * 
 * @param value The value to debounce
 * @param delay Base delay in milliseconds
 * @param options Advanced options for debounce behavior
 * @returns The debounced value
 */
function useEnhancedDebounce<T>(
  value: T, 
  delay: number = 500, 
  options: DebounceOptions = {}
): T {
  const {
    shortDelay = 10,
    mediumDelay = 50,
    longDelay = 80,
    immediate = false,
    inputBasedTiming = true
  } = options;
  
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const initialValueRef = useRef<boolean>(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousValueRef = useRef<T>(value);
  
  useEffect(() => {
    // Skip debounce if value hasn't changed
    if (JSON.stringify(previousValueRef.current) === JSON.stringify(value)) {
      return;
    }
    
    previousValueRef.current = value;
    
    // Handle immediate execution on first change if enabled
    if (initialValueRef.current && immediate) {
      setDebouncedValue(value);
      initialValueRef.current = false;
      return;
    }
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Calculate optimal delay based on input type and length
    let adjustedDelay = delay;
    
    if (inputBasedTiming && typeof value === 'string') {
      const strValue = value as string;
      if (strValue.length <= 1) {
        adjustedDelay = shortDelay;  // Almost immediate for first character
      } else if (strValue.length <= 3) {
        adjustedDelay = mediumDelay; // Quick for short terms
      } else {
        adjustedDelay = Math.min(delay, longDelay); // Cap for longer terms
      }
    }
    
    // Set the new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      timeoutRef.current = null;
    }, adjustedDelay);
    
    // Cleanup on unmount or value change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, shortDelay, mediumDelay, longDelay, immediate, inputBasedTiming]);

  return debouncedValue;
}

export default useEnhancedDebounce;

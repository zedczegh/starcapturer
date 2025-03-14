
import { useEffect, useState } from 'react';

/**
 * A hook that debounces a value by delaying updates until after a specific delay
 * This helps reduce the number of calculations, API calls, and renders
 * 
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // For very short inputs (1-2 characters), use a shorter delay
    // to make the search feel more responsive
    const adjustedDelay = typeof value === 'string' && 
                          (value as string).length <= 2 ? 
                          Math.min(delay, 50) : delay;
    
    // Update the debounced value after the specified delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, adjustedDelay);

    // Cancel the timeout if value changes or component unmounts
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;


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
    // For very short search terms (1-3 characters), use almost no delay
    // to make the search feel immediate and responsive
    let adjustedDelay = delay;
    
    if (typeof value === 'string') {
      const strValue = value as string;
      if (strValue.length <= 1) {
        adjustedDelay = 10; // Almost immediate for first character
      } else if (strValue.length <= 3) {
        adjustedDelay = 20; // Very quick for short terms
      } else {
        adjustedDelay = Math.min(delay, 80); // Cap at 80ms for longer terms
      }
    }
    
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

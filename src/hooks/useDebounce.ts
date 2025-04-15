
import useEnhancedDebounce from './useEnhancedDebounce';

/**
 * A hook that debounces a value by delaying updates until after a specific delay
 * This helps reduce the number of calculations, API calls, and renders
 * 
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  return useEnhancedDebounce(value, delay, {
    shortDelay: 10,
    mediumDelay: 20,
    longDelay: 80,
    inputBasedTiming: true
  });
}

export default useDebounce;

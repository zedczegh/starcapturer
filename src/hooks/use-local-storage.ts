
import { useState, useEffect } from 'react';

/**
 * Custom hook for persisting state in localStorage
 * @param key The localStorage key
 * @param initialValue The initial value
 * @returns [storedValue, setValue] tuple
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Initialize with stored value or initial value
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(parseStoredValue(item));
      }
    } catch (error) {
      console.log('Error reading from localStorage:', error);
    }
  }, [key]);

  // Parse stored value based on type
  const parseStoredValue = (value: string): T => {
    try {
      return JSON.parse(value);
    } catch {
      // If the value isn't JSON, return it directly
      // This handles strings that aren't JSON formatted
      return value as unknown as T;
    }
  };

  // Return a wrapped version of useState's setter function
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      if (valueToStore === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log('Error writing to localStorage:', error);
    }
  };

  return [storedValue, setValue];
}

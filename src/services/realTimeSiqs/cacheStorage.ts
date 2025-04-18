
// Local storage functionality for SIQS cache

/**
 * Save SIQS data to session storage
 * @param key Cache key
 * @param data SIQS data to store
 * @param timestamp Timestamp when the data was calculated
 */
export const saveToSessionStorage = (key: string, data: any, timestamp: number): void => {
  try {
    sessionStorage.setItem(`siqs_${key}`, JSON.stringify({
      data,
      timestamp
    }));
  } catch (error) {
    console.error("Failed to store SIQS in sessionStorage:", error);
  }
};

/**
 * Load SIQS data from session storage
 * @param key Cache key
 */
export const loadFromSessionStorage = (key: string): { data: any; timestamp: number } | null => {
  try {
    const storedData = sessionStorage.getItem(`siqs_${key}`);
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error("Failed to load SIQS from sessionStorage:", error);
  }
  return null;
};

/**
 * Clear a specific SIQS entry from session storage
 * @param key Cache key
 */
export const removeFromSessionStorage = (key: string): void => {
  try {
    sessionStorage.removeItem(`siqs_${key}`);
  } catch (error) {
    console.error("Failed to remove SIQS from sessionStorage:", error);
  }
};

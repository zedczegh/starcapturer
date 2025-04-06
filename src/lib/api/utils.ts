
/**
 * Utility functions for API operations
 */

/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 * @param lat1 First latitude
 * @param lon1 First longitude
 * @param lat2 Second latitude
 * @param lon2 Second longitude
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * 
    Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  
  return distance;
}

/**
 * Normalize longitude to ensure it's within -180 to 180 range
 * @param longitude Longitude value to normalize
 * @returns Normalized longitude
 */
export function normalizeLongitude(longitude: number): number {
  // Ensure longitude is within -180 to 180 range
  let normalizedLon = longitude % 360;
  
  if (normalizedLon > 180) {
    normalizedLon -= 360;
  } else if (normalizedLon < -180) {
    normalizedLon += 360;
  }
  
  return normalizedLon;
}

/**
 * Add timeout to fetch operation for more reliable API calls
 * @param promise The fetch Promise
 * @param timeout Timeout in milliseconds
 * @returns Promise with timeout capability
 */
export function fetchWithTimeout<T>(
  promise: Promise<T>, 
  timeout: number = 8000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timed out after ${timeout}ms`));
      }, timeout);
    })
  ]);
}

/**
 * Format API error for consistent error handling
 * @param error Error object
 * @param apiName Name of the API for error context
 * @returns Formatted error message
 */
export function formatApiError(error: any, apiName: string): string {
  if (error && error.message) {
    return `${apiName} API Error: ${error.message}`;
  }
  return `${apiName} API Error: Unknown error occurred`;
}

/**
 * Parse API response safely with error handling
 * @param response Fetch response
 * @param apiName Name of the API for error context
 * @returns Parsed response data
 */
export async function parseApiResponse(response: Response, apiName: string): Promise<any> {
  try {
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    throw new Error(formatApiError(error, apiName));
  }
}

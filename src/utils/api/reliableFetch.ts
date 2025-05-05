
/**
 * Reliable API fetch utility with automatic retries and metrics
 */
import { recordApiCall } from './apiMetricsTracker';

export interface ReliableFetchOptions extends RequestInit {
  maxRetries?: number;
  retryDelay?: number;
  retryBackoffFactor?: number;
  timeout?: number;
  endpointName?: string;
}

/**
 * Enhanced fetch with automatic retries, timeouts and metric tracking
 */
export async function reliableFetch<T = any>(
  url: string,
  options: ReliableFetchOptions = {}
): Promise<T> {
  const {
    maxRetries = 2,
    retryDelay = 1000,
    retryBackoffFactor = 1.5,
    timeout = 10000,
    endpointName = extractEndpointName(url),
    ...fetchOptions
  } = options;

  let attempt = 0;
  let lastError: Error | null = null;
  const startTime = Date.now();
  
  while (attempt <= maxRetries) {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Add signal to request options
      const requestOptions = {
        ...fetchOptions,
        signal: controller.signal,
      };
      
      // Perform fetch
      const response = await fetch(url, requestOptions);
      
      // Clear timeout since the request completed
      clearTimeout(timeoutId);
      
      // Record API call duration
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        // Log non-successful responses
        const errorText = await response.text();
        const errorDetails = `HTTP ${response.status}: ${errorText}`;
        
        if (attempt < maxRetries) {
          lastError = new Error(errorDetails);
          await waitForRetry(retryDelay * Math.pow(retryBackoffFactor, attempt));
          attempt++;
          continue;
        }
        
        // Record failed API call after all retries
        recordApiCall(endpointName, false, duration, errorDetails, attempt);
        throw new Error(`${errorDetails} (after ${attempt} retries)`);
      }
      
      // Parse and return successful response
      const data = await response.json() as T;
      
      // Record successful API call
      recordApiCall(endpointName, true, duration, undefined, attempt > 0 ? attempt : undefined);
      
      return data;
    } catch (error) {
      // Clear timeout to prevent leaks
      clearTimeout(timeoutId);
      
      // Record API call duration for error
      const duration = Date.now() - startTime;
      
      // Handle network errors and timeouts
      const errorMessage = error instanceof Error ? error.message : String(error);
      lastError = error instanceof Error ? error : new Error(errorMessage);
      
      // Break early if it's an abort error from the user (not our timeout)
      if (
        error instanceof DOMException && 
        error.name === 'AbortError' && 
        fetchOptions.signal?.aborted
      ) {
        recordApiCall(endpointName, false, duration, "User aborted request");
        throw new Error("Request aborted by user");
      }
      
      if (attempt < maxRetries) {
        await waitForRetry(retryDelay * Math.pow(retryBackoffFactor, attempt));
        attempt++;
        continue;
      }
      
      // Record failed API call after all retries
      recordApiCall(endpointName, false, duration, errorMessage, attempt);
      
      // Enhance error with retry information
      throw new Error(`${errorMessage} (after ${attempt} retries)`);
    }
  }
  
  // This should never be reached but TypeScript wants it
  throw lastError || new Error("Unknown error in reliableFetch");
}

/**
 * Wait for the specified delay before retrying
 */
function waitForRetry(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract a readable endpoint name from URL for metrics
 */
function extractEndpointName(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    // Extract the last meaningful segment of the path
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0) {
      return `${urlObj.hostname}/${segments.join('/')}`;
    }
    return urlObj.hostname;
  } catch {
    // If URL parsing fails, use the full URL (might be a relative path)
    return url;
  }
}


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
  retryStatusCodes?: number[];
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
    retryStatusCodes = [408, 429, 500, 502, 503, 504],
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
        signal: fetchOptions.signal ? fetchOptions.signal : controller.signal,
      };
      
      // Perform fetch
      const response = await fetch(url, requestOptions);
      
      // Clear timeout since the request completed
      clearTimeout(timeoutId);
      
      // Record API call duration
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        // Log non-successful responses
        let errorText;
        try {
          errorText = await response.text();
        } catch (textError) {
          errorText = "Could not read error response";
          console.error("Error reading error response:", textError);
        }
        
        const errorDetails = `HTTP ${response.status}: ${errorText}`;
        
        // Check if we should retry based on status code
        const shouldRetry = attempt < maxRetries && 
          (retryStatusCodes.includes(response.status) || response.status >= 500);
        
        if (shouldRetry) {
          lastError = new Error(errorDetails);
          const delayTime = retryDelay * Math.pow(retryBackoffFactor, attempt);
          console.log(`Retrying request to ${url} after ${delayTime}ms (attempt ${attempt + 1}/${maxRetries})`);
          await waitForRetry(delayTime);
          attempt++;
          continue;
        }
        
        // Record failed API call after all retries
        recordApiCall(endpointName, false, duration, errorDetails, attempt);
        throw new Error(`${errorDetails} (after ${attempt} retries)`);
      }
      
      // Parse and return successful response
      let data;
      try {
        data = await response.json() as T;
      } catch (jsonError) {
        // Handle case where response cannot be parsed as JSON
        console.error("Error parsing JSON response:", jsonError);
        
        if (attempt < maxRetries) {
          lastError = new Error(`Invalid JSON response: ${jsonError.message}`);
          await waitForRetry(retryDelay * Math.pow(retryBackoffFactor, attempt));
          attempt++;
          continue;
        }
        
        recordApiCall(endpointName, false, duration, `JSON parse error: ${jsonError.message}`, attempt);
        throw new Error(`Invalid JSON response: ${jsonError.message} (after ${attempt} retries)`);
      }
      
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
      
      // Determine if we should retry
      const isNetworkError = !navigator.onLine || 
        errorMessage.includes('network') || 
        errorMessage.includes('failed to fetch') ||
        errorMessage.includes('NetworkError');
      
      if (attempt < maxRetries && (error instanceof TypeError || isNetworkError || error.name === 'AbortError')) {
        const delayTime = retryDelay * Math.pow(retryBackoffFactor, attempt);
        console.log(`Network error, retrying request to ${url} after ${delayTime}ms (attempt ${attempt + 1}/${maxRetries})`);
        await waitForRetry(delayTime);
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

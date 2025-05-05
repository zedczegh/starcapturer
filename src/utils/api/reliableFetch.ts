
/**
 * Reliable API fetch utility with automatic retries, metrics, and improved error handling
 */
import { recordApiCall } from './apiMetricsTracker';

export interface ReliableFetchOptions extends RequestInit {
  maxRetries?: number;
  retryDelay?: number;
  retryBackoffFactor?: number;
  timeout?: number;
  endpointName?: string;
  retryStatusCodes?: number[];
  onProgress?: (attempt: number, maxRetries: number) => void;
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
    onProgress,
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
      // Notify progress if callback provided
      if (onProgress) {
        onProgress(attempt, maxRetries);
      }
      
      // Add signal to request options, preserving any existing signal
      const signal = fetchOptions.signal 
        ? composeAbortSignals(fetchOptions.signal, controller.signal) 
        : controller.signal;
        
      const requestOptions = {
        ...fetchOptions,
        signal,
      };
      
      // Perform fetch
      const response = await fetch(url, requestOptions);
      
      // Clear timeout since the request completed
      clearTimeout(timeoutId);
      
      // Record API call duration
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        // Log non-successful responses
        const errorText = await safeReadResponseText(response);
        const errorDetails = `HTTP ${response.status}: ${errorText}`;
        
        // Check if we should retry based on status code
        const shouldRetry = retryStatusCodes.includes(response.status) && attempt < maxRetries;
        
        if (shouldRetry) {
          lastError = new Error(errorDetails);
          const currentDelay = retryDelay * Math.pow(retryBackoffFactor, attempt);
          console.warn(`Retrying fetch due to status ${response.status} in ${currentDelay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await waitForRetry(currentDelay);
          attempt++;
          continue;
        }
        
        // Record failed API call after all retries
        recordApiCall(endpointName, false, duration, errorDetails, attempt);
        throw new Error(`${errorDetails} (after ${attempt > 0 ? attempt : 0} retries)`);
      }
      
      // Parse and return successful response
      const data = await safeParseJson(response);
      
      // Record successful API call
      recordApiCall(endpointName, true, duration, undefined, attempt > 0 ? attempt : undefined);
      
      return data as T;
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
        const currentDelay = retryDelay * Math.pow(retryBackoffFactor, attempt);
        console.warn(`Retrying fetch due to error: ${errorMessage} in ${currentDelay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await waitForRetry(currentDelay);
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

/**
 * Safely read response text with error handling
 */
async function safeReadResponseText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch (error) {
    return `[Failed to read response body: ${error}]`;
  }
}

/**
 * Safely parse JSON with error handling
 */
async function safeParseJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to parse response as JSON: ${error}`);
  }
}

/**
 * Compose multiple AbortSignals into one that aborts when any signal aborts
 */
function composeAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    
    signal.addEventListener('abort', () => {
      controller.abort(signal.reason);
    }, { once: true });
  }
  
  return controller.signal;
}

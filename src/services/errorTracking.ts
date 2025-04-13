
/**
 * Error tracking service for handling application errors
 */

// Create a simple in-memory error store
const errorStore: Record<string, {
  count: number,
  lastOccurred: Date,
  message: string
}> = {};

/**
 * Track an error with a specific key
 * @param key Unique identifier for this type of error
 * @param error The error object
 * @param context Additional context information
 */
export const trackError = (key: string, error: Error | string, context?: Record<string, any>) => {
  const message = typeof error === 'string' ? error : error.message;
  const stack = error instanceof Error ? error.stack : undefined;
  
  console.error(`[${key}] Error:`, message, context || '', stack || '');
  
  // Update the error store
  if (errorStore[key]) {
    errorStore[key].count += 1;
    errorStore[key].lastOccurred = new Date();
    errorStore[key].message = message;
  } else {
    errorStore[key] = {
      count: 1,
      lastOccurred: new Date(),
      message
    };
  }
  
  // Handle specific errors
  if (key === 'dynamic-import-error') {
    console.log('Attempting recovery for dynamic import error');
    // Clear any cached modules that might be causing issues
    try {
      // Clear storage related to module caching
      localStorage.removeItem('vite-plugin-pwa:assets:mru');
      // Add specific recovery logic here
    } catch (e) {
      console.error('Failed recovery attempt:', e);
    }
  }
};

/**
 * Get error statistics
 */
export const getErrorStats = () => {
  return Object.entries(errorStore).map(([key, data]) => ({
    key,
    count: data.count,
    lastOccurred: data.lastOccurred,
    message: data.message
  }));
};

/**
 * Clear error history
 */
export const clearErrorHistory = () => {
  Object.keys(errorStore).forEach(key => {
    delete errorStore[key];
  });
};


/**
 * Enhanced error logging utility for SIQS calculations and related functions
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Configure logging levels (can be extended based on environment)
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Default minimum log level (can be adjusted based on environment)
let currentLogLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'error' : 'debug';

/**
 * Set the minimum log level for the application
 * @param level The minimum log level to display
 */
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

/**
 * Check if a log level should be displayed
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel];
}

/**
 * Format an error object for logging
 */
function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack || ''}`;
  }
  return String(error);
}

/**
 * Log a debug message
 */
export function logDebug(message: string, data?: any): void {
  if (!shouldLog('debug')) return;
  console.debug(`[DEBUG] ${message}`, data !== undefined ? data : '');
}

/**
 * Log an info message
 */
export function logInfo(message: string, data?: any): void {
  if (!shouldLog('info')) return;
  console.log(`[INFO] ${message}`, data !== undefined ? data : '');
}

/**
 * Log a warning message
 */
export function logWarning(message: string, data?: any): void {
  if (!shouldLog('warn')) return;
  console.warn(`[WARNING] ${message}`, data !== undefined ? data : '');
}

/**
 * Log an error message with enhanced formatting
 */
export function logError(message: string, error?: unknown, additionalData?: any): void {
  if (!shouldLog('error')) return;
  
  const errorDetails = error ? `\n${formatError(error)}` : '';
  const dataDetails = additionalData ? `\nAdditional data: ${JSON.stringify(additionalData, null, 2)}` : '';
  
  console.error(`[ERROR] ${message}${errorDetails}${dataDetails}`);
}

/**
 * Safely execute a function with error handling
 * @param fn Function to execute
 * @param errorMessage Message to log if an error occurs
 * @param fallbackValue Value to return if an error occurs
 */
export function safeExecute<T>(
  fn: () => T,
  errorMessage: string,
  fallbackValue: T
): T {
  try {
    return fn();
  } catch (error) {
    logError(errorMessage, error);
    return fallbackValue;
  }
}

/**
 * Safely execute an async function with error handling
 * @param fn Async function to execute
 * @param errorMessage Message to log if an error occurs
 * @param fallbackValue Value to return if an error occurs
 */
export async function safeExecuteAsync<T>(
  fn: () => Promise<T>,
  errorMessage: string,
  fallbackValue: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logError(errorMessage, error);
    return fallbackValue;
  }
}

/**
 * Create a performance measurement utility
 * @param operationName Name of the operation being measured
 */
export function createPerformanceTracker(operationName: string) {
  const startTime = performance.now();
  
  return {
    /**
     * End the performance measurement and log the result
     * @param additionalInfo Additional information to include in the log
     */
    end: (additionalInfo?: string) => {
      const duration = performance.now() - startTime;
      const infoText = additionalInfo ? ` (${additionalInfo})` : '';
      logDebug(`${operationName}${infoText} completed in ${duration.toFixed(2)}ms`);
      return duration;
    }
  };
}

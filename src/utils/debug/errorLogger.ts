
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
 * Format data for logging
 */
function formatData(data: any): string {
  if (data === undefined || data === '') return '';
  
  try {
    if (typeof data === 'object' && data !== null) {
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  } catch (err) {
    return '[Unserializable data]';
  }
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
  const dataDetails = additionalData ? `\nAdditional data: ${formatData(additionalData)}` : '';
  
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

/**
 * Group related log messages together
 * @param groupName Name of the log group
 * @param fn Function to execute within the group
 */
export function logGroup<T>(groupName: string, fn: () => T): T {
  if (shouldLog('debug')) {
    console.group(`[GROUP] ${groupName}`);
    try {
      return fn();
    } finally {
      console.groupEnd();
    }
  } else {
    return fn();
  }
}

/**
 * Attach a value to the console for debugging
 * Useful when you want to expose an object globally for browser debugging
 * @param name Name to attach to window.console
 * @param value Value to expose
 */
export function exposeForDebugging(name: string, value: any): void {
  if (!shouldLog('debug')) return;
  
  try {
    (console as any)[`$${name}`] = value;
    console.log(`[DEBUG] Exposed ${name} to console.$${name}`);
  } catch (error) {
    console.warn(`[DEBUG] Failed to expose ${name} for debugging`);
  }
}

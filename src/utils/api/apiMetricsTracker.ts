
/**
 * API Metrics Tracker
 * 
 * Tracks API call performance, success rates, and errors to improve
 * reliability and accountability of external API dependencies.
 */

type ApiMetric = {
  endpoint: string;
  success: boolean;
  duration: number;
  timestamp: number;
  errorDetails?: string;
  retries?: number;
};

interface ApiMetricsStorage {
  calls: Record<string, ApiMetric[]>;
  summary: Record<string, {
    totalCalls: number;
    successRate: number;
    averageDuration: number;
    failureCount: number;
    lastFailure?: {
      timestamp: number;
      error: string;
    };
  }>;
}

// In-memory storage for metrics
const apiMetrics: ApiMetricsStorage = {
  calls: {},
  summary: {}
};

// Constants for metrics management
const MAX_METRICS_PER_ENDPOINT = 100;
const METRICS_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Record an API call metric
 */
export function recordApiCall(
  endpoint: string, 
  success: boolean, 
  duration: number,
  errorDetails?: string,
  retries?: number
): void {
  const metric: ApiMetric = {
    endpoint,
    success,
    duration,
    timestamp: Date.now(),
    errorDetails,
    retries
  };

  // Initialize endpoint metrics if needed
  if (!apiMetrics.calls[endpoint]) {
    apiMetrics.calls[endpoint] = [];
  }

  // Add new metric
  apiMetrics.calls[endpoint].unshift(metric);
  
  // Trim old metrics
  if (apiMetrics.calls[endpoint].length > MAX_METRICS_PER_ENDPOINT) {
    apiMetrics.calls[endpoint] = apiMetrics.calls[endpoint].slice(0, MAX_METRICS_PER_ENDPOINT);
  }

  // Update summary statistics
  updateSummaryStatistics(endpoint);
}

/**
 * Update the summary statistics for an endpoint
 */
function updateSummaryStatistics(endpoint: string): void {
  const metrics = apiMetrics.calls[endpoint];
  if (!metrics || metrics.length === 0) return;

  const totalCalls = metrics.length;
  const successfulCalls = metrics.filter(m => m.success).length;
  const successRate = (successfulCalls / totalCalls) * 100;
  const averageDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / totalCalls;
  const failureCount = totalCalls - successfulCalls;

  let lastFailure = undefined;
  const lastFailedCall = metrics.find(m => !m.success);
  if (lastFailedCall) {
    lastFailure = {
      timestamp: lastFailedCall.timestamp,
      error: lastFailedCall.errorDetails || "Unknown error"
    };
  }

  apiMetrics.summary[endpoint] = {
    totalCalls,
    successRate,
    averageDuration,
    failureCount,
    lastFailure
  };
}

/**
 * Get metrics summary for all endpoints
 */
export function getApiMetricsSummary(): Record<string, any> {
  // Clean up old metrics before returning summary
  cleanupOldMetrics();
  return apiMetrics.summary;
}

/**
 * Get detailed metrics for a specific endpoint
 */
export function getEndpointMetrics(endpoint: string): ApiMetric[] {
  return apiMetrics.calls[endpoint] || [];
}

/**
 * Clean up metrics older than retention period
 */
function cleanupOldMetrics(): void {
  const now = Date.now();
  const cutoff = now - METRICS_RETENTION_MS;

  // Clean up each endpoint's metrics
  Object.keys(apiMetrics.calls).forEach(endpoint => {
    apiMetrics.calls[endpoint] = apiMetrics.calls[endpoint].filter(
      metric => metric.timestamp >= cutoff
    );

    // Recalculate summary after cleanup
    if (apiMetrics.calls[endpoint].length > 0) {
      updateSummaryStatistics(endpoint);
    } else {
      // Remove empty endpoint entries
      delete apiMetrics.calls[endpoint];
      delete apiMetrics.summary[endpoint];
    }
  });
}

/**
 * Get reliability score for an endpoint (0-100)
 */
export function getEndpointReliabilityScore(endpoint: string): number {
  const summary = apiMetrics.summary[endpoint];
  if (!summary) return 100; // Assume perfect if no data

  // Calculate weighted score based on success rate and recency of failures
  let score = summary.successRate;

  // Penalize for recent failures
  if (summary.lastFailure) {
    const hoursSinceFailure = (Date.now() - summary.lastFailure.timestamp) / (60 * 60 * 1000);
    if (hoursSinceFailure < 1) {
      // More penalty for very recent failures
      score -= 20;
    } else if (hoursSinceFailure < 6) {
      score -= 10;
    } else if (hoursSinceFailure < 24) {
      score -= 5;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Reset metrics for testing/debugging
 */
export function resetApiMetrics(): void {
  apiMetrics.calls = {};
  apiMetrics.summary = {};
}


/**
 * Forecast Health Monitoring Service
 * 
 * Tracks API reliability, data quality, and performance metrics
 * for the forecast services.
 */

import { getApiMetricsSummary, getEndpointReliabilityScore } from '@/utils/api/apiMetricsTracker';

// Health check status types
export type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';

// Service health interface
export interface ServiceHealth {
  status: HealthStatus;
  reliability: number;
  lastChecked: Date;
  issues: string[];
  endpoints: Record<string, {
    status: HealthStatus;
    reliability: number;
    calls: number;
    failures: number;
    averageResponseTime: number;
  }>;
}

/**
 * Get the current health status of forecast services
 */
export function getForecastServicesHealth(): ServiceHealth {
  const metrics = getApiMetricsSummary();
  const forecasterEndpoints = Object.keys(metrics).filter(
    endpoint => endpoint.includes('open-meteo')
  );
  
  // Default health status
  const health: ServiceHealth = {
    status: 'unknown',
    reliability: 100,
    lastChecked: new Date(),
    issues: [],
    endpoints: {}
  };
  
  if (forecasterEndpoints.length === 0) {
    return health;
  }
  
  // Process each forecast-related endpoint
  let overallReliability = 0;
  let criticalEndpoints = 0;
  let degradedEndpoints = 0;
  
  for (const endpoint of forecasterEndpoints) {
    const summary = metrics[endpoint];
    const reliability = getEndpointReliabilityScore(endpoint);
    
    let status: HealthStatus = 'healthy';
    if (reliability < 50) {
      status = 'critical';
      criticalEndpoints++;
    } else if (reliability < 80) {
      status = 'degraded';
      degradedEndpoints++;
    }
    
    health.endpoints[endpoint] = {
      status,
      reliability,
      calls: summary.totalCalls,
      failures: summary.failureCount,
      averageResponseTime: summary.averageDuration
    };
    
    overallReliability += reliability;
    
    // Track issues for degraded or critical endpoints
    if (status !== 'healthy' && summary.lastFailure) {
      const hoursSince = (Date.now() - summary.lastFailure.timestamp) / (60 * 60 * 1000);
      health.issues.push(
        `Endpoint ${endpoint} is ${status}: ${summary.lastFailure.error} (${hoursSince.toFixed(1)}h ago)`
      );
    }
  }
  
  // Calculate overall health status
  health.reliability = Math.round(overallReliability / forecasterEndpoints.length);
  
  if (criticalEndpoints > 0) {
    health.status = 'critical';
  } else if (degradedEndpoints > 0) {
    health.status = 'degraded';
  } else {
    health.status = 'healthy';
  }
  
  return health;
}

/**
 * Determine if forecast services are available and reliable
 */
export function areForecastServicesReliable(): boolean {
  const health = getForecastServicesHealth();
  return health.status !== 'critical' && health.reliability > 70;
}

/**
 * Get the best available forecast endpoint based on reliability
 */
export function getBestForecastEndpoint(): string | null {
  const health = getForecastServicesHealth();
  
  // Find the most reliable endpoint
  let bestEndpoint: string | null = null;
  let bestReliability = 0;
  
  for (const [endpoint, metrics] of Object.entries(health.endpoints)) {
    if (metrics.reliability > bestReliability) {
      bestReliability = metrics.reliability;
      bestEndpoint = endpoint;
    }
  }
  
  return bestEndpoint;
}

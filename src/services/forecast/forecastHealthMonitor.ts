
/**
 * Simple health monitor for forecast services
 */

export type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';

export interface ServiceHealth {
  status: HealthStatus;
  reliability: number;
  lastChecked: Date;
  failures: number;
  issues: string[];
  endpoints: Record<string, {
    status: HealthStatus;
    reliability: number;
    calls: number;
  }>;
}

// Track health for each endpoint
const endpointHealth: Record<string, {
  calls: number;
  failures: number;
  lastCheck: number;
  status: HealthStatus;
  reliability: number;
}> = {};

let serviceHealth = {
  reliable: true,
  lastCheck: Date.now(),
  failures: 0,
  maxFailures: 3,
  cooldownMs: 5 * 60 * 1000 // 5 minutes
};

export const areForecastServicesReliable = (): boolean => {
  // Reset failures after cooldown period
  if (!serviceHealth.reliable && 
      Date.now() - serviceHealth.lastCheck > serviceHealth.cooldownMs) {
    resetServiceHealth();
  }
  
  return serviceHealth.reliable;
};

export const reportServiceSuccess = (endpoint?: string): void => {
  if (serviceHealth.failures > 0) {
    serviceHealth.failures--;
  }
  
  if (!serviceHealth.reliable && serviceHealth.failures < serviceHealth.maxFailures) {
    serviceHealth.reliable = true;
  }
  
  serviceHealth.lastCheck = Date.now();
  
  // Track endpoint success if provided
  if (endpoint) {
    if (!endpointHealth[endpoint]) {
      endpointHealth[endpoint] = {
        calls: 0,
        failures: 0,
        lastCheck: Date.now(),
        status: 'healthy',
        reliability: 100
      };
    }
    
    endpointHealth[endpoint].calls++;
    if (endpointHealth[endpoint].failures > 0) {
      endpointHealth[endpoint].failures--;
    }
    
    // Update reliability
    endpointHealth[endpoint].reliability = 100 - (
      (endpointHealth[endpoint].failures / endpointHealth[endpoint].calls) * 100
    );
    
    // Update status
    endpointHealth[endpoint].status = getStatusFromReliability(endpointHealth[endpoint].reliability);
    endpointHealth[endpoint].lastCheck = Date.now();
  }
};

export const reportServiceFailure = (endpoint?: string): void => {
  serviceHealth.failures++;
  serviceHealth.lastCheck = Date.now();
  
  if (serviceHealth.failures >= serviceHealth.maxFailures) {
    serviceHealth.reliable = false;
  }
  
  // Track endpoint failure if provided
  if (endpoint) {
    if (!endpointHealth[endpoint]) {
      endpointHealth[endpoint] = {
        calls: 0,
        failures: 1,
        lastCheck: Date.now(),
        status: 'degraded',
        reliability: 0
      };
    } else {
      endpointHealth[endpoint].failures++;
      endpointHealth[endpoint].calls++;
    }
    
    // Update reliability
    endpointHealth[endpoint].reliability = 100 - (
      (endpointHealth[endpoint].failures / endpointHealth[endpoint].calls) * 100
    );
    
    // Update status
    endpointHealth[endpoint].status = getStatusFromReliability(endpointHealth[endpoint].reliability);
    endpointHealth[endpoint].lastCheck = Date.now();
  }
};

export const resetServiceHealth = (): void => {
  serviceHealth = {
    reliable: true,
    lastCheck: Date.now(),
    failures: 0,
    maxFailures: 3,
    cooldownMs: 5 * 60 * 1000
  };
  
  Object.keys(endpointHealth).forEach(key => {
    delete endpointHealth[key];
  });
};

// Get the overall health status of forecast services
export const getForecastServicesHealth = (): ServiceHealth => {
  const totalCalls = Object.values(endpointHealth).reduce((sum, ep) => sum + ep.calls, 0);
  const totalFailures = Object.values(endpointHealth).reduce((sum, ep) => sum + ep.failures, 0);
  
  const overallReliability = totalCalls > 0 ? 
    Math.round(100 - ((totalFailures / totalCalls) * 100)) : 
    serviceHealth.reliable ? 100 : 0;
  
  const issues: string[] = [];
  if (totalFailures > 0) {
    issues.push(`${totalFailures} failures detected across ${Object.keys(endpointHealth).length} endpoints`);
  }
  
  if (!serviceHealth.reliable) {
    issues.push('Service is temporarily unreliable due to consecutive failures');
  }
  
  return {
    status: getStatusFromReliability(overallReliability),
    reliability: overallReliability,
    lastChecked: new Date(serviceHealth.lastCheck),
    failures: serviceHealth.failures,
    issues,
    endpoints: Object.fromEntries(
      Object.entries(endpointHealth).map(([key, data]) => [
        key,
        {
          status: data.status,
          reliability: Math.round(data.reliability),
          calls: data.calls
        }
      ])
    )
  };
};

// Helper function to determine health status from reliability percentage
const getStatusFromReliability = (reliability: number): HealthStatus => {
  if (reliability >= 90) return 'healthy';
  if (reliability >= 70) return 'degraded';
  return 'critical';
};

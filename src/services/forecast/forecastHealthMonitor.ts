
/**
 * Simple monitoring service for forecast API health
 */

export type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';

export interface ServiceHealth {
  status: HealthStatus;
  reliability: number;
  lastChecked: Date;
  issues: string[];
  endpoints: Record<string, {
    status: HealthStatus;
    reliability: number;
    calls: number;
  }>;
}

interface EndpointHealth {
  endpoint: string;
  status: 'healthy' | 'degraded' | 'down';
  lastChecked: Date;
  successRate: number;
  requestCount: number;
  successCount: number;
  averageResponseTime: number;
}

class ForecastHealthMonitor {
  private serviceHealth: Map<string, EndpointHealth> = new Map();
  
  constructor() {
    // Initialize with default values
    this.serviceHealth.set('/forecast/basic', {
      endpoint: '/forecast/basic',
      status: 'healthy',
      lastChecked: new Date(),
      successRate: 100,
      requestCount: 0,
      successCount: 0,
      averageResponseTime: 0
    });
    
    this.serviceHealth.set('/forecast/enhanced', {
      endpoint: '/forecast/enhanced',
      status: 'healthy',
      lastChecked: new Date(),
      successRate: 100,
      requestCount: 0,
      successCount: 0,
      averageResponseTime: 0
    });
    
    this.serviceHealth.set('/forecast/day', {
      endpoint: '/forecast/day',
      status: 'healthy',
      lastChecked: new Date(),
      successRate: 100,
      requestCount: 0,
      successCount: 0,
      averageResponseTime: 0
    });
  }
  
  public reportSuccess(endpoint: string, responseTimeMs: number = 200): void {
    this.updateMetrics(endpoint, true, responseTimeMs);
  }
  
  public reportFailure(endpoint: string, responseTimeMs: number = 500): void {
    this.updateMetrics(endpoint, false, responseTimeMs);
  }
  
  private updateMetrics(endpoint: string, success: boolean, responseTimeMs: number): void {
    if (!this.serviceHealth.has(endpoint)) {
      this.serviceHealth.set(endpoint, {
        endpoint,
        status: 'healthy',
        lastChecked: new Date(),
        successRate: 100,
        requestCount: 0,
        successCount: 0,
        averageResponseTime: 0
      });
    }
    
    const health = this.serviceHealth.get(endpoint)!;
    
    // Update metrics
    health.lastChecked = new Date();
    health.requestCount++;
    if (success) {
      health.successCount++;
    }
    
    // Update success rate
    health.successRate = (health.successCount / health.requestCount) * 100;
    
    // Update average response time with weighted average
    if (health.requestCount === 1) {
      health.averageResponseTime = responseTimeMs;
    } else {
      health.averageResponseTime = 
        ((health.averageResponseTime * (health.requestCount - 1)) + responseTimeMs) / health.requestCount;
    }
    
    // Update status based on success rate
    if (health.successRate >= 95) {
      health.status = 'healthy';
    } else if (health.successRate >= 80) {
      health.status = 'degraded';
    } else {
      health.status = 'down';
    }
    
    this.serviceHealth.set(endpoint, health);
  }
  
  public getServiceHealth(): EndpointHealth[] {
    return Array.from(this.serviceHealth.values());
  }
  
  public getEndpointHealth(endpoint: string): EndpointHealth | undefined {
    return this.serviceHealth.get(endpoint);
  }
  
  public getForecastServicesHealth(): ServiceHealth {
    const endpointStatuses = this.getServiceHealth();
    
    // Calculate overall health
    let totalReliability = 0;
    let criticalIssueCount = 0;
    const issues: string[] = [];
    const endpoints: Record<string, {status: HealthStatus; reliability: number; calls: number}> = {};
    
    endpointStatuses.forEach(endpoint => {
      // Convert status
      const status: HealthStatus = 
        endpoint.status === 'healthy' ? 'healthy' :
        endpoint.status === 'degraded' ? 'degraded' : 'critical';
      
      // Add to endpoints object
      endpoints[endpoint.endpoint] = {
        status,
        reliability: endpoint.successRate,
        calls: endpoint.requestCount
      };
      
      // Add to reliability calculation if endpoint has been called
      if (endpoint.requestCount > 0) {
        totalReliability += endpoint.successRate;
      }
      
      // Check for issues
      if (endpoint.status === 'degraded') {
        issues.push(`${endpoint.endpoint} endpoint is experiencing degraded performance (${endpoint.successRate.toFixed(0)}% success rate)`);
      }
      
      if (endpoint.status === 'down') {
        issues.push(`${endpoint.endpoint} endpoint is down (${endpoint.successRate.toFixed(0)}% success rate)`);
        criticalIssueCount++;
      }
    });
    
    // Calculate overall reliability as average of endpoint reliabilities
    const avgReliability = endpointStatuses.length > 0 && endpointStatuses.some(e => e.requestCount > 0)
      ? totalReliability / endpointStatuses.filter(e => e.requestCount > 0).length
      : 100;
    
    // Determine overall status
    let overallStatus: HealthStatus = 'healthy';
    
    if (criticalIssueCount > 0) {
      overallStatus = 'critical';
    } else if (issues.length > 0 || avgReliability < 95) {
      overallStatus = 'degraded';
    }
    
    return {
      status: overallStatus,
      reliability: Math.round(avgReliability),
      lastChecked: new Date(),
      issues,
      endpoints
    };
  }
}

const healthMonitor = new ForecastHealthMonitor();

export const reportServiceSuccess = (
  endpoint: string = '/forecast/basic',
  responseTimeMs: number = Math.floor(Math.random() * 200) + 100
): void => {
  healthMonitor.reportSuccess(endpoint, responseTimeMs);
};

export const reportServiceFailure = (
  endpoint: string = '/forecast/basic',
  responseTimeMs: number = Math.floor(Math.random() * 300) + 300
): void => {
  healthMonitor.reportFailure(endpoint, responseTimeMs);
};

export const getServiceHealthStatus = (): EndpointHealth[] => {
  return healthMonitor.getServiceHealth();
};

export const getForecastServicesHealth = (): ServiceHealth => {
  return healthMonitor.getForecastServicesHealth();
};

export default healthMonitor;

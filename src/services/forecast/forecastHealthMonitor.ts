
/**
 * Simple monitoring service for forecast API health
 */

interface ServiceHealth {
  endpoint: string;
  status: 'healthy' | 'degraded' | 'down';
  lastChecked: Date;
  successRate: number;
  requestCount: number;
  successCount: number;
  averageResponseTime: number;
}

class ForecastHealthMonitor {
  private serviceHealth: Map<string, ServiceHealth> = new Map();
  
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
  
  public getServiceHealth(): ServiceHealth[] {
    return Array.from(this.serviceHealth.values());
  }
  
  public getEndpointHealth(endpoint: string): ServiceHealth | undefined {
    return this.serviceHealth.get(endpoint);
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

export const getServiceHealthStatus = (): ServiceHealth[] => {
  return healthMonitor.getServiceHealth();
};

export default healthMonitor;

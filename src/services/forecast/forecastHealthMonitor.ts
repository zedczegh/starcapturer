
/**
 * Simple health monitor for forecast services
 */

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

export const reportServiceSuccess = (): void => {
  if (serviceHealth.failures > 0) {
    serviceHealth.failures--;
  }
  
  if (!serviceHealth.reliable && serviceHealth.failures < serviceHealth.maxFailures) {
    serviceHealth.reliable = true;
  }
  
  serviceHealth.lastCheck = Date.now();
};

export const reportServiceFailure = (): void => {
  serviceHealth.failures++;
  serviceHealth.lastCheck = Date.now();
  
  if (serviceHealth.failures >= serviceHealth.maxFailures) {
    serviceHealth.reliable = false;
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
};

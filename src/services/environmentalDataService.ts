
// Re-export everything from the index file for backward compatibility
export * from './environmentalDataService/index';

// Add a cache utility for environmental data to improve performance
export const environmentalDataCache = {
  bortleScaleCache: new Map<string, number>(),
  weatherCache: new Map<string, any>(),
  
  // Cache methods
  setBortleScale(location: string, value: number): void {
    this.bortleScaleCache.set(location, value);
  },
  
  getBortleScale(location: string): number | undefined {
    return this.bortleScaleCache.get(location);
  },
  
  setWeatherData(location: string, data: any): void {
    this.weatherCache.set(location, {
      data,
      timestamp: Date.now()
    });
  },
  
  getWeatherData(location: string, maxAge: number = 15 * 60 * 1000): any | undefined {
    const cached = this.weatherCache.get(location);
    if (cached && (Date.now() - cached.timestamp) < maxAge) {
      return cached.data;
    }
    return undefined;
  },
  
  clear(): void {
    this.bortleScaleCache.clear();
    this.weatherCache.clear();
  }
};

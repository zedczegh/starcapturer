
export interface SiqsCalculationOptions {
  useSingleHourSampling?: boolean;
  targetHour?: number;
  cacheDurationMins?: number;
}

export interface SiqsResult {
  siqs: number;
  confidence?: number;
  weatherData?: any;
  forecastData?: any;
  metadata?: {
    calculatedAt?: string;
    provider?: string;
  };
}

export interface ISiqsService {
  calculateSiqs(
    latitude: number,
    longitude: number,
    bortleScale: number,
    options?: SiqsCalculationOptions
  ): Promise<SiqsResult>;
  
  batchCalculateSiqs(locations: Array<{
    latitude: number;
    longitude: number;
    bortleScale: number;
  }>): Promise<Map<string, SiqsResult>>;
  
  clearCache(): void;
  getCacheSize(): number;
  getProvider(): string;
}

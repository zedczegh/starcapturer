
export interface LocationData {
  latitude: number;
  longitude: number;
  name?: string;
  bortleScale?: number;
  siqs?: number;
}

export interface SIQSCalculationOptions {
  useSingleHourSampling?: boolean;
  targetHour?: number;
  cacheDurationMins?: number;
}

export interface IMapService {
  calculateSIQS(
    latitude: number, 
    longitude: number, 
    bortleScale: number,
    options?: SIQSCalculationOptions
  ): Promise<{ siqs: number; confidence?: number }>;
  
  getLightPollutionData(latitude: number, longitude: number): Promise<{ bortleScale: number }>;
  getLocationName(latitude: number, longitude: number): Promise<string>;
  getProvider(): string;
}

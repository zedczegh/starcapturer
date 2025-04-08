
declare module "@/types/weather" {
  export interface WeatherData {
    temperature: number;
    humidity: number;
    cloudCover: number;
    windSpeed: number;
    precipitation: number;
    time: string;
    condition: string;
    aqi?: number;
    weatherCondition?: string | number;
  }

  export interface LocationData {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    bortleScale: number;
    seeingConditions: number;
    weatherData: WeatherData;
    siqsResult?: SIQSData;
    moonPhase?: number;
    timestamp: string;
  }

  export interface SIQSData {
    score: number;
    isViable: boolean;
    factors?: Array<{
      name: string;
      score: number;
      description: string;
      nighttimeData?: {
        average: number;
        timeRange: string;
        detail?: {
          evening: number;
          morning: number;
        };
      };
    }>;
    metadata?: {
      calculationType: string;
      timestamp: string;
      eveningCloudCover?: number;
      morningCloudCover?: number;
      avgNightCloudCover?: number;
    };
  }

  export interface SharedAstroSpot {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    bortleScale: number;
    description?: string;
    imageURL?: string;
    rating?: number;
    timestamp: string;
    chineseName?: string;
    siqs?: number | {
      score: number;
      isViable: boolean;
    };
    siqsResult?: SIQSData;
    siqsFactors?: Array<any>;
    distance?: number;
    isViable?: boolean;
    isDarkSkyReserve?: boolean;
    certification?: string;
    weatherData?: WeatherData;
  }
}

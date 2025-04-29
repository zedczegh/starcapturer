
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
      nighttimeData?: any;
    }>;
    nighttimeCloudData?: {
      average: number | null;
      evening: number | null;
      morning: number | null;
    } | null;
  }

  export interface SharedAstroSpot {
    id?: string;
    name?: string;
    displayName?: string;
    siqs?: number | { score: number; isViable: boolean };
    bortleScale?: number;
    latitude: number;
    longitude: number;
    altitude?: number;
    timezone?: string;
    distance?: number;
    isDarkSkyReserve?: boolean;
    certification?: string;
    siqsConfidence?: number;
    images?: string[];
    createdAt?: string;
    updatedAt?: string;
    userId?: string;
    username?: string;
    description?: string;
    advantages?: string[];
    type?: string;
    preferenceScore?: number;
    clearSkyRate?: number;
    isCertified?: boolean;
    certificationRating?: number;
    timeInfo?: {
      isNighttime: boolean;
      timeUntilNight?: number;
      timeUntilDaylight?: number;
    };
    date?: string | Date;
    user_id?: string;
    isForecast?: boolean;
    forecastDate?: string;
    weatherData?: WeatherData;
    cloudCover?: number;
    photographer?: string;
    chineseName?: string;
    timestamp?: string;
  }
}

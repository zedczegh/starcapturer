
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
    distance?: number;
    isViable?: boolean;
    siqsFactors?: Array<{
      name: string;
      score: number;
      description: string;
    }>;
    certification?: string;
    isDarkSkyReserve?: boolean;
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
  }
}


declare interface LocationWithWeather {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  bortleScale: number;
  seeingConditions: number;
  weatherData: any;
  siqsResult: any;
  moonPhase: number;
  timestamp: string;
  skyBrightness?: {
    value: number;
    mpsas?: number;
    timestamp?: string;
  };
}

declare interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

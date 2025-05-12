
export type Language = "en" | "zh";

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
  placeDetails?: string;
  bortleScale?: number;
  formattedName?: string;
}

export interface CityAlternative {
  name: string;
  chinese: string;
  alternatives: string[];
  coordinates: [number, number];
  placeDetails?: string;
}

export interface ChineseLocation {
  areaCode: string;
  provinceCode: string;
  province: string;
  cityCode: string;
  city: string;
  districtCode: string;
  district: string;
  nameEn: string;
  pinyin: string;
  longitude: number;
  latitude: number;
  bortleScale?: number;
}

export interface GeocodeResponse {
  success: boolean;
  results: Location[];
  error?: string;
}

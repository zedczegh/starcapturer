
export type Language = 'en' | 'zh' | 'ja' | 'ko';

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
  placeDetails?: string;
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

// Add the MatchScore interface to consolidate types
export type { MatchScore, PinyinVariation, PinyinVariationsMap } from './matching/types';

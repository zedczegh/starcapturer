
export interface Location {
  name: string;
  latitude: number;
  longitude: number;
  type?: string;  // Adding the type property that's referenced in matcher.ts
  description?: string;
  chineseName?: string;
  country?: string;
  region?: string;
}


// Define the GeoLocation type used in RecommendationsSection and other components
export interface GeoLocation {
  latitude: number;
  longitude: number;
  name?: string;
  formattedName?: string;
  placeDetails?: string;
}

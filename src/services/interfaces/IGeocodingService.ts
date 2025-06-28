
export interface LocationDetails {
  formattedName: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

export interface IGeocodingService {
  getLocationDetails(latitude: number, longitude: number): Promise<LocationDetails>;
  searchLocation(query: string): Promise<LocationDetails[]>;
  getProvider(): string;
}

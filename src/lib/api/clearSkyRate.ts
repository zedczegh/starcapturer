
import { API_URL } from './config';

export async function fetchClearSkyRate(
  latitude: number, 
  longitude: number, 
  includeHistoricalData: boolean = true
): Promise<ClearSkyRateResponse> {
  try {
    const url = `${API_URL}/clear-sky?lat=${Number(latitude).toFixed(4)}&lng=${Number(longitude).toFixed(4)}${includeHistoricalData ? '&historical=true' : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    
    // Ensure numeric values are properly cast
    return {
      annualRate: Number(data.annualRate),
      rate3months: Number(data.rate3months),
      rateMonth: Number(data.rateMonth),
      source: data.source,
      calmDays: Number(data.calmDays)
    };
  } catch (error) {
    console.error(`Failed to fetch clear sky rate for ${latitude}, ${longitude}:`, error);
    
    // Return default values
    return {
      annualRate: 65,
      rate3months: 60,
      rateMonth: 55,
      source: "default",
      calmDays: 0
    };
  }
}

export interface ClearSkyRateResponse {
  annualRate: number;
  rate3months: number;
  rateMonth: number;
  source: string;
  calmDays: number;
}

// Add a cache clearing function
export function clearClearSkyRateCache(latitude?: number, longitude?: number) {
  // Implement cache clearing logic if needed
  console.log(`Clearing cache for ${latitude}, ${longitude}`);
}

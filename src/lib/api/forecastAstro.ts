
import { Coordinates, validateCoordinates } from './coordinates';
import { fetchLongRangeForecastData } from './forecast';

/**
 * Interface for astronomical forecast response
 */
export interface AstroForecastResponse {
  latitude: number;
  longitude: number;
  generationTime: number;
  timezone: string;
  daily: {
    time: string[];
    cloudCover: number[];
    moonPhase: number[];
    moonrise: string[];
    moonset: string[];
    sunset: string[];
    sunrise: string[];
    astronomicalTwilight: {
      begin: string[];
      end: string[];
    };
    siqsScore: number[];
    isViable: boolean[];
  };
}

/**
 * Fetches astronomical forecast data for a specific location
 * 
 * @param coordinates Location coordinates
 * @param signal Optional abort signal for cancellation
 * @returns Promise resolving to astronomical forecast response
 */
export async function fetchAstroForecastData(
  coordinates: Coordinates, 
  signal?: AbortSignal
): Promise<AstroForecastResponse | null> {
  try {
    const validCoords = validateCoordinates(coordinates);
    
    // First, get the basic weather forecast
    const forecastData = await fetchLongRangeForecastData(validCoords, {
      signal
    });
    
    if (!forecastData) {
      throw new Error("Failed to fetch base forecast data");
    }
    
    // Extract general metadata
    const { latitude, longitude, timezone, daily } = forecastData;
    
    // Create enhanced astro forecast response
    const astroForecast: AstroForecastResponse = {
      latitude,
      longitude,
      generationTime: forecastData.generationtime_ms,
      timezone,
      daily: {
        time: daily.time,
        cloudCover: daily.cloud_cover_mean,
        // These are placeholders - we would need actual data sources for these
        moonPhase: Array(daily.time.length).fill(0),
        moonrise: Array(daily.time.length).fill(""),
        moonset: Array(daily.time.length).fill(""),
        sunrise: Array(daily.time.length).fill(""),
        sunset: Array(daily.time.length).fill(""),
        astronomicalTwilight: {
          begin: Array(daily.time.length).fill(""),
          end: Array(daily.time.length).fill("")
        },
        // SIQS scores would be calculated based on multiple parameters
        siqsScore: daily.cloud_cover_mean.map(cc => {
          // Simple placeholder algorithm - in reality we'd use the SIQS calculation
          const baseScore = 10 - (cc / 10);
          return Math.max(0, Math.min(10, baseScore));
        }),
        // Viability is a simplified estimate here
        isViable: daily.cloud_cover_mean.map(cc => cc < 30)
      }
    };
    
    return astroForecast;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('Astro forecast data fetch aborted');
      throw error;
    }
    console.error("Error fetching astro forecast data:", error);
    return null;
  }
}

/**
 * Update the API export with the new functionality
 */
export * from './forecastAstro';


import * as weatherApi from './api/weather';
import * as locationApi from './api/location';
import * as forecastApi from './api/forecast';
import * as pollutionApi from './api/pollution';
import * as astroSpotsApi from './api/astroSpots';
import * as coordinatesApi from './api/coordinates';
import * as clearSkyRateApi from './api/clearSkyRate';

/**
 * Fetch air quality data for a location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Air quality data
 */
export async function fetchAirQualityData(latitude: number, longitude: number) {
  try {
    const response = await fetch(
      `https://api.waqi.info/feed/geo:${latitude};${longitude}/?token=demo`
    );
    
    const data = await response.json();
    
    if (data && data.status === 'ok') {
      return {
        aqi: data.data.aqi,
        dominantPollutant: data.data.dominantPol,
        timestamp: data.data.time.iso
      };
    }
    
    return { aqi: 50, dominantPollutant: 'unknown', timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Error fetching air quality data:', error);
    // Return default moderate air quality
    return { aqi: 50, dominantPollutant: 'unknown', timestamp: new Date().toISOString() };
  }
}

export { 
  weatherApi, 
  locationApi, 
  forecastApi, 
  pollutionApi, 
  astroSpotsApi, 
  coordinatesApi, 
  clearSkyRateApi 
};


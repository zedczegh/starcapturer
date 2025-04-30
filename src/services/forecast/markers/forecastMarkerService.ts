
/**
 * Forecast Map Marker Service
 * 
 * Creates and manages map markers for forecast data
 * using consistent styling with the existing marker components
 */

import L from "leaflet";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { ForecastDayAstroData } from "../types/forecastTypes";
import { getLocationColor, getCertificationColor, getSiqsClass } from "@/utils/markerUtils";
import { forecastMapService } from "../integration/mapIntegration";
import { enhancedForecastAstroService } from "../enhancedForecastAstroAdapter";
import { getSiqsScore } from "@/utils/siqsHelpers";

/**
 * Service for creating map markers from forecast data
 * that match the styling of our existing spot markers
 */
export const forecastMarkerService = {
  /**
   * Create a marker icon for a forecast location
   * Uses the same styling as the existing spot markers
   * 
   * @param location Forecast location data
   * @param isCertified Whether the location is certified
   * @param isHovered Whether the marker is currently hovered
   * @param isMobile Whether we're on a mobile device
   * @returns Leaflet icon for the marker
   */
  createForecastMarker: (
    location: SharedAstroSpot,
    isCertified: boolean = false,
    isHovered: boolean = false,
    isMobile: boolean = false
  ): L.DivIcon => {
    // Get the marker color based on location properties
    const color = getLocationColor(location);
    
    // Determine size based on device and hover state
    const size = isMobile ? 
      (isHovered ? 22 : 16) : // Mobile sizes
      (isHovered ? 28 : 24);  // Desktop sizes
    
    // Create a marker with a custom HTML representation
    return L.divIcon({
      className: 'custom-forecast-icon',
      html: `
        <div 
          style="
            background-color: ${color}; 
            width: ${size}px; 
            height: ${size}px; 
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 4px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
          "
        >
          ${isCertified ? 
            `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
             </svg>` : 
            ''}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  },

  /**
   * Generate markers for potential astronomy spots based on forecast data
   * 
   * @param centerLat Center latitude for the search area
   * @param centerLng Center longitude for the search area
   * @param radiusKm Radius in kilometers to search
   * @param dayIndex Index of the forecast day (0 = today)
   * @param limit Maximum number of spots to generate
   * @returns Promise resolving to array of Leaflet markers
   */
  generateForecastMarkers: async (
    centerLat: number,
    centerLng: number,
    radiusKm: number = 50,
    dayIndex: number = 0,
    limit: number = 5,
    minQuality: number = 5,
    isMobile: boolean = false
  ): Promise<{
    markers: L.Marker[];
    locations: SharedAstroSpot[];
  }> => {
    try {
      // Use the existing mapIntegration service to find potential spots
      const potentialSpots = await forecastMapService.generatePotentialSpots(
        centerLat,
        centerLng,
        radiusKm,
        minQuality,
        limit,
        dayIndex
      );
      
      // Create a marker for each potential spot
      const markers = potentialSpots.map(spot => {
        const icon = forecastMarkerService.createForecastMarker(
          spot,
          false, // Not certified
          false, // Not hovered
          isMobile
        );
        
        return L.marker([spot.latitude, spot.longitude], { icon });
      });
      
      return {
        markers,
        locations: potentialSpots
      };
    } catch (error) {
      console.error("Error generating forecast markers:", error);
      return {
        markers: [],
        locations: []
      };
    }
  },
  
  /**
   * Create markers for the best astro days locations
   * 
   * @param latitude Base location latitude
   * @param longitude Base location longitude
   * @param daysAhead Number of days to look ahead
   * @param minQuality Minimum quality threshold (0-10)
   * @returns Promise resolving to array of Leaflet markers for best days
   */
  getBestDaysMarkers: async (
    latitude: number,
    longitude: number,
    daysAhead: number = 7,
    minQuality: number = 6,
    isMobile: boolean = false
  ): Promise<{
    markers: L.Marker[];
    forecastDays: ForecastDayAstroData[];
  }> => {
    try {
      // Get best astro days from forecasting service
      const bestDays = await enhancedForecastAstroService.getBestAstroDays(
        latitude,
        longitude,
        undefined, // Use default bortle scale
        minQuality
      );
      
      // Filter to requested days ahead
      const filteredDays = bestDays.filter(day => day.dayIndex <= daysAhead);
      
      // Create a marker for each best day
      const markers = filteredDays.map(day => {
        // Create a spot representation for the marker
        const spot: SharedAstroSpot = {
          id: `forecast-day-${day.dayIndex}`,
          name: `Best Day: ${new Date(day.date).toLocaleDateString()}`,
          latitude,
          longitude,
          bortleScale: day.siqsResult?.bortleScale || 4,
          siqs: day.siqs ? day.siqs * 10 : 0,
          isViable: day.isViable,
          distance: 0,
          timestamp: new Date().toISOString(),
          timeInfo: {
            isNighttime: false,
            timeUntilNight: 0,
            timeUntilDaylight: 0
          }
        };
        
        const icon = forecastMarkerService.createForecastMarker(
          spot,
          false, // Not certified
          false, // Not hovered
          isMobile
        );
        
        return L.marker([latitude, longitude], { icon });
      });
      
      return {
        markers,
        forecastDays: filteredDays
      };
    } catch (error) {
      console.error("Error generating best days markers:", error);
      return {
        markers: [],
        forecastDays: []
      };
    }
  },
  
  /**
   * Create a popup content HTML string for a forecast location
   * 
   * @param location Location data
   * @param forecast Forecast data
   * @returns HTML string for popup content
   */
  createForecastPopupContent: (
    location: SharedAstroSpot,
    forecast?: ForecastDayAstroData
  ): string => {
    const siqsScore = getSiqsScore(location.siqs) / 10;
    const siqsClass = getSiqsClass(siqsScore);
    
    let weatherInfo = '';
    if (forecast) {
      weatherInfo = `
        <div class="text-xs mt-1">
          <div>Cloud: ${forecast.cloudCover}%</div>
          <div>Temp: ${forecast.temperature.min}°-${forecast.temperature.max}°</div>
          <div>Precip: ${forecast.precipitation.probability}%</div>
        </div>
      `;
    }
    
    return `
      <div class="p-2 ${siqsClass} marker-popup-gradient text-white">
        <div class="font-medium">${location.name}</div>
        <div class="text-sm">Quality: ${siqsScore.toFixed(1)}/10</div>
        ${weatherInfo}
        <div class="text-xs text-gray-300 mt-1">
          ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}
        </div>
      </div>
    `;
  }
};

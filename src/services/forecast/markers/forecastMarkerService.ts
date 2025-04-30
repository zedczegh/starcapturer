
import L from "leaflet";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { ForecastDayAstroData } from "../types/forecastTypes";
import { enhancedForecastAstroService } from "../enhancedForecastAstroService";
import forecastMapService from "../integration/mapIntegration";

class ForecastMarkerService {
  async generateForecastMarkers(
    centerLat: number,
    centerLng: number,
    radiusKm: number,
    dayIndex: number = 0,
    pointCount: number = 5,
    minQuality: number = 5,
    isMobile: boolean = false
  ): Promise<{
    markers: L.Marker[];
    locations: SharedAstroSpot[];
  }> {
    // Generate sample points within the radius
    const points = this.generateSamplePoints(centerLat, centerLng, radiusKm, pointCount);
    
    // Create batch location data
    const batchLocations = points.map((point, idx) => ({
      latitude: point[0],
      longitude: point[1],
      name: `Forecast Spot ${idx + 1}`,
      bortleScale: 4 // Default value
    }));
    
    // Add center point
    batchLocations.push({
      latitude: centerLat,
      longitude: centerLng,
      name: "Your Location",
      bortleScale: 4
    });
    
    // Process all locations for the forecast
    const forecastResults = await enhancedForecastAstroService.batchProcessLocations(
      batchLocations,
      dayIndex
    );
    
    // Filter for viable locations
    const viableResults = forecastResults.filter(
      result => result.success && result.forecast && result.forecast.siqs >= minQuality
    );
    
    // Convert to SharedAstroSpots
    const locations: SharedAstroSpot[] = viableResults.map((result, idx) => ({
      id: `forecast-${result.location.latitude}-${result.location.longitude}`,
      name: result.location.name || `Forecast Spot ${idx + 1}`,
      latitude: result.location.latitude,
      longitude: result.location.longitude,
      siqs: result.forecast ? result.forecast.siqs : 0,
      bortleScale: result.location.bortleScale || 4,
      timestamp: new Date().toISOString(),
      isForecast: true,
      forecastDay: dayIndex,
      cloudCover: result.forecast ? result.forecast.cloudCover : 0,
      forecastDate: result.forecast ? result.forecast.date : new Date().toISOString().split('T')[0],
      timeInfo: {
        isNighttime: true
      }
    }));
    
    // Create markers
    const markers = locations.map(location => {
      const icon = this.createForecastIcon(location.siqs || 0);
      
      // Create marker
      const marker = L.marker([location.latitude, location.longitude], {
        icon
      });
      
      return marker;
    });
    
    return { markers, locations };
  }
  
  // Generate sample points within radius
  private generateSamplePoints(
    centerLat: number,
    centerLng: number,
    radiusKm: number,
    count: number
  ): [number, number][] {
    const points: [number, number][] = [];
    
    // Convert radius from km to degrees (approximate)
    const radiusDeg = radiusKm / 111;
    
    // Generate random points using a polar coordinate approach
    for (let i = 0; i < count; i++) {
      // Random angle
      const angle = Math.random() * 2 * Math.PI;
      // Random distance within radius (with square root for uniform distribution)
      const distance = radiusDeg * Math.sqrt(Math.random());
      
      // Convert polar to cartesian coordinates
      const x = centerLng + distance * Math.cos(angle) / Math.cos(centerLat * Math.PI / 180);
      const y = centerLat + distance * Math.sin(angle);
      
      points.push([y, x]);
    }
    
    return points;
  }
  
  // Create forecast marker icon based on quality
  private createForecastIcon(quality: number): L.Icon {
    // Determine color based on quality
    let iconUrl = '/marker.png';
    
    if (quality >= 8) {
      iconUrl = '/forecast-excellent.png';
    } else if (quality >= 6) {
      iconUrl = '/forecast-good.png';
    } else if (quality >= 4) {
      iconUrl = '/forecast-fair.png';
    } else {
      iconUrl = '/forecast-poor.png';
    }
    
    return new L.Icon({
      iconUrl,
      iconSize: [24, 32],
      iconAnchor: [12, 32],
      popupAnchor: [0, -32]
    });
  }
  
  // Create popup content for forecast marker
  createForecastPopupContent(location: SharedAstroSpot): string {
    let content = `<div class="popup-content">`;
    content += `<div class="popup-title">${location.name || 'Forecast Location'}</div>`;
    
    if (location.forecastDate) {
      content += `<div class="popup-detail">Date: ${location.forecastDate}</div>`;
    }
    
    if (typeof location.cloudCover === 'number') {
      content += `<div class="popup-detail">Cloud Cover: ${Math.round(location.cloudCover * 100)}%</div>`;
    }
    
    if (location.siqs) {
      const siqsValue = typeof location.siqs === 'number' ? 
        location.siqs : 
        location.siqs.score;
      content += `<div class="popup-detail">SIQS Score: ${siqsValue.toFixed(1)}</div>`;
    }
    
    content += `</div>`;
    return content;
  }
}

export const forecastMarkerService = new ForecastMarkerService();
export default forecastMarkerService;

import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Service for generating forecast markers and popups on the map
 */
class ForecastMarkerService {
  /**
   * Generate forecast markers for a given location
   */
  async generateForecastMarkers(
    latitude: number,
    longitude: number,
    radiusKm: number,
    dayIndex: number,
    limit: number,
    minQuality: number,
    isMobile: boolean
  ): Promise<{ markers: L.Marker[], locations: SharedAstroSpot[] }> {
    // Mock implementation - replace with actual forecast data
    const markers: L.Marker[] = [];
    const locations: SharedAstroSpot[] = [];
    
    for (let i = 0; i < limit; i++) {
      const spotLat = latitude + (Math.random() - 0.5) * 0.5;
      const spotLng = longitude + (Math.random() - 0.5) * 0.5;
      const siqs = Math.round(Math.random() * 100);
      
      if (siqs < minQuality) continue;
      
      const location: SharedAstroSpot = {
        id: `mock-forecast-${i}`,
        name: `Spot ${i}`,
        latitude: spotLat,
        longitude: spotLng,
        bortleScale: Math.floor(Math.random() * 9) + 1,
        timestamp: new Date().toISOString(),
        siqs: siqs,
        isViable: siqs > 50,
        isForecast: true,
        forecastDay: dayIndex,
        forecastDate: new Date().toISOString().split('T')[0],
        cloudCover: Math.random(),
      };
      
      const marker = L.marker([spotLat, spotLng], {
        icon: new L.Icon({
          iconUrl: '/forecast-marker.png',
          iconSize: [24, 32],
          iconAnchor: [12, 32],
          popupAnchor: [0, -32]
        })
      });
      
      markers.push(marker);
      locations.push(location);
    }
    
    return { markers, locations };
  }
  
  /**
   * Create forecast popup content for a given location
   */
  createForecastPopupContent(location: SharedAstroSpot): string {
    const name = location.name || 'Unnamed Location';
    const date = location.forecastDate || 'Unknown Date';
    const cloudCover = Math.round((location.cloudCover || 0) * 100);

    // Format the SIQS score correctly
    const siqsDisplay = (siqs: number | { score: number; isViable: boolean } | undefined): string => {
      if (siqs === undefined || siqs === null) {
        return 'N/A';
      }
      
      if (typeof siqs === 'object') {
        return siqs.score.toFixed(1);
      }
      
      return siqs.toFixed(1);
    };

    const siqsScore = siqsDisplay(location.siqs);

    return `
      <div>
        <h3 style="font-size: 1.2em; margin-bottom: 0.5em;">${name}</h3>
        <p style="margin-bottom: 0.3em;">Date: ${date}</p>
        <p style="margin-bottom: 0.3em;">Cloud Cover: ${cloudCover}%</p>
        <p style="margin-bottom: 0.3em;">SIQS: ${siqsScore}</p>
      </div>
    `;
  }
}

export const forecastMarkerService = new ForecastMarkerService();


import L from "leaflet";
import { SharedAstroSpot } from "@/lib/api/astroSpots";

// Add default export
export default class MarkerManager {
  private markers: Map<string, L.Marker> = new Map();
  
  // Create a marker for a location
  createMarker(location: SharedAstroSpot, icon: L.Icon): L.Marker {
    const marker = L.marker([location.latitude, location.longitude], { icon });
    
    // Store the marker with a unique identifier
    const id = location.id || `${location.latitude}-${location.longitude}`;
    this.markers.set(id, marker);
    
    return marker;
  }
  
  // Get a marker by location ID
  getMarker(id: string): L.Marker | undefined {
    return this.markers.get(id);
  }
  
  // Remove a marker by location ID
  removeMarker(id: string): boolean {
    const marker = this.markers.get(id);
    if (marker) {
      marker.remove();
      return this.markers.delete(id);
    }
    return false;
  }
  
  // Remove all markers
  clearMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers.clear();
  }
  
  // Get all markers
  getAllMarkers(): L.Marker[] {
    return Array.from(this.markers.values());
  }
  
  // Create popup content for a location
  createPopupContent(location: SharedAstroSpot): string {
    let content = `<div class="popup-content">`;
    content += `<div class="popup-title">${location.name || 'Unknown Location'}</div>`;
    
    if (location.bortleScale) {
      content += `<div class="popup-detail">Bortle Scale: ${location.bortleScale}</div>`;
    }
    
    if (location.siqs) {
      const siqsValue = typeof location.siqs === 'number' ? 
        location.siqs : 
        location.siqs.score;
      content += `<div class="popup-detail">SIQS Score: ${siqsValue}</div>`;
    }
    
    if (location.distance) {
      content += `<div class="popup-detail">Distance: ${location.distance} km</div>`;
    }
    
    if (location.description) {
      content += `<div class="popup-description">${location.description || ''}</div>`;
    }
    
    content += `</div>`;
    return content;
  }
}

// Export additional utilities as needed
export const createMarkerIcon = (isActive: boolean = false, isCertified: boolean = false): L.Icon => {
  const iconUrl = isCertified 
    ? (isActive ? '/certified-marker-active.png' : '/certified-marker.png') 
    : (isActive ? '/marker-active.png' : '/marker.png');
  
  return new L.Icon({
    iconUrl,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32]
  });
};

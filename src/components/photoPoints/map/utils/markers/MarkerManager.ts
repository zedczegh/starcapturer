
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import L from "leaflet";

class MarkerManager {
  private markers: Map<string, L.Marker> = new Map();
  private map: L.Map | null = null;
  
  constructor(map: L.Map | null = null) {
    this.map = map;
  }
  
  setMap(map: L.Map) {
    this.map = map;
  }
  
  addMarker(id: string, marker: L.Marker) {
    this.markers.set(id, marker);
    
    if (this.map) {
      marker.addTo(this.map);
    }
  }
  
  getMarker(id: string): L.Marker | undefined {
    return this.markers.get(id);
  }
  
  removeMarker(id: string) {
    const marker = this.markers.get(id);
    if (marker && this.map) {
      marker.removeFrom(this.map);
    }
    this.markers.delete(id);
  }
  
  removeAllMarkers() {
    this.markers.forEach((marker) => {
      if (this.map) {
        marker.removeFrom(this.map);
      }
    });
    this.markers.clear();
  }
  
  updateMarkerIcon(id: string, icon: L.Icon) {
    const marker = this.markers.get(id);
    if (marker) {
      marker.setIcon(icon);
    }
  }
  
  getAllMarkers(): L.Marker[] {
    return Array.from(this.markers.values());
  }
  
  getMarkerCount(): number {
    return this.markers.size;
  }
  
  getMarkerIds(): string[] {
    return Array.from(this.markers.keys());
  }
  
  // Creates tooltip content for a location
  createTooltipContent(location: SharedAstroSpot): string {
    const name = location.name || 'Unnamed Location';
    const description = location.description ? ` - ${location.description}` : '';
    return `${name}${description}`;
  }
}

export default MarkerManager;

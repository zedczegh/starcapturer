
import React, { useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import CommunityMapMarker from "./CommunityMapMarker";
import { useUserGeolocation } from "@/hooks/community/useUserGeolocation";
import CommunityUserLocationMarker from "./CommunityUserLocationMarker";
import MapClickHandler from "../location/map/MapClickHandler";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Info } from "lucide-react";
import BortleScaleOverlay from "./BortleScaleOverlay";
import BortleScaleLegend from "./BortleScaleLegend";


interface CommunityMapProps {
  center: [number, number];
  locations: SharedAstroSpot[];
  hoveredLocationId?: string | null;
  onMarkerClick?: (spot: SharedAstroSpot) => void;
  isMobile?: boolean;
  zoom?: number;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

const CommunityMap: React.FC<CommunityMapProps> = ({
  center,
  locations,
  hoveredLocationId,
  onMarkerClick,
  isMobile = false,
  zoom = 3,
  onLocationUpdate
}) => {
  const { position: userPosition, updatePosition } = useUserGeolocation();
  const [showBortleOverlay, setShowBortleOverlay] = useState(true);
  const [bortleOpacity, setBortleOpacity] = useState(0.7);
  const [showLegend, setShowLegend] = useState(false);

  const handleLocationUpdate = (lat: number, lng: number) => {
    updatePosition(lat, lng);
    if (onLocationUpdate) {
      onLocationUpdate(lat, lng);
    }
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", background: "#010e1a" }}
        worldCopyJump
        attributionControl={false}
      >
        {/* Base Map Layer */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        
        {/* Bortle Scale Overlay */}
        {showBortleOverlay && (
          <BortleScaleOverlay 
            locations={locations} 
            opacity={bortleOpacity}
          />
        )}

        {userPosition && (
          <CommunityUserLocationMarker 
            position={userPosition} 
            onLocationUpdate={handleLocationUpdate} 
            draggable={!!onLocationUpdate}
          />
        )}
        {locations.map((spot) => (
          <CommunityMapMarker
            key={spot.id}
            spot={spot}
            isHovered={hoveredLocationId === spot.id}
            isMobile={isMobile}
            onMarkerClick={onMarkerClick}
          />
        ))}
        {onLocationUpdate && <MapClickHandler onClick={onLocationUpdate} />}
      </MapContainer>

      {/* Bortle Scale Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowBortleOverlay(!showBortleOverlay)}
            className="bg-cosmic-900/90 backdrop-blur-xl border border-primary/20 hover:border-primary/40 shadow-lg gap-2"
            title={showBortleOverlay ? "Hide Bortle scale zones" : "Show Bortle scale zones"}
          >
            {showBortleOverlay ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span className="text-xs">Bortle Zones</span>
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowLegend(!showLegend)}
            className="bg-cosmic-900/90 backdrop-blur-xl border border-primary/20 hover:border-primary/40 shadow-lg"
            title="Show Bortle scale legend"
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
        
        {showBortleOverlay && (
          <div className="bg-cosmic-900/90 backdrop-blur-xl border border-primary/20 rounded-lg p-3 shadow-lg">
            <label className="text-xs text-cosmic-200 mb-2 block">Zone Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={bortleOpacity}
              onChange={(e) => setBortleOpacity(parseFloat(e.target.value))}
              className="w-full h-1 bg-cosmic-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="text-xs text-cosmic-400 mt-1 text-center">
              {Math.round(bortleOpacity * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* Bortle Scale Legend */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 z-[1000] max-w-sm max-h-[70vh] overflow-y-auto">
          <BortleScaleLegend />
        </div>
      )}
    </div>
  );
};

export default CommunityMap;

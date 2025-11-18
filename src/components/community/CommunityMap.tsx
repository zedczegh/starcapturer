
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import CommunityMapMarker from "./CommunityMapMarker";
import { useUserGeolocation } from "@/hooks/community/useUserGeolocation";
import CommunityUserLocationMarker from "./CommunityUserLocationMarker";
import MapClickHandler from "../location/map/MapClickHandler";
import { Button } from "@/components/ui/button";
import { Layers } from "lucide-react";
import DarkSkyHeatMap from "./DarkSkyHeatMap";
import { getAllDarkSkyLocations } from "@/services/darkSkyLocationService";

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
  const [lightPollutionOpacity, setLightPollutionOpacity] = useState(0.7);
  const [darkSkyLocations, setDarkSkyLocations] = useState<any[]>([]);
  const [combinedMode, setCombinedMode] = useState(false);

  // Log when component mounts
  useEffect(() => {
    console.log('CommunityMap mounted with light pollution opacity:', lightPollutionOpacity);
  }, []);

  useEffect(() => {
    const fetchDarkSkyLocations = async () => {
      try {
        const locations = await getAllDarkSkyLocations();
        setDarkSkyLocations(locations);
      } catch (error) {
        console.error("Error fetching dark sky locations:", error);
      }
    };
    
    if (combinedMode) {
      fetchDarkSkyLocations();
    }
  }, [combinedMode]);

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
        style={{ height: "100%", width: "100%", background: "#1a1f2e" }}
        worldCopyJump
        attributionControl={false}
      >
        {/* Base Map Layer */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        
        {/* Light Pollution Overlay - djlorenz.github.io (Working Source) */}
        <TileLayer
          url="https://djlorenz.github.io/astronomy/lp2022/overlay/tiles/{z}/{x}/{y}.png"
          opacity={lightPollutionOpacity}
          maxZoom={19}
          attribution='Light pollution © David Lorenz'
        />

        {/* Dark Sky Heat Map Layer - Only in Combined Mode */}
        {combinedMode && (
          <DarkSkyHeatMap 
            locations={darkSkyLocations}
            intensity={0.6}
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

      {/* Map Layer Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        {/* Combined Mode Toggle */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setCombinedMode(!combinedMode)}
          className={`backdrop-blur-xl border shadow-lg gap-2 ${
            combinedMode 
              ? 'bg-primary/90 border-primary hover:bg-primary text-primary-foreground' 
              : 'bg-cosmic-900/90 border-primary/20 hover:border-primary/40'
          }`}
          title={combinedMode ? "Hide dark sky heat map overlay" : "Show dark sky heat map overlay"}
        >
          <Layers className="h-4 w-4" />
          <span className="text-xs">Dark Sky Overlay</span>
        </Button>

        {/* Light Pollution Opacity Control */}
        <div className="bg-cosmic-900/90 backdrop-blur-xl border border-primary/20 rounded-lg p-3 shadow-lg">
          <label className="text-xs text-cosmic-200 mb-2 block">Light Pollution Opacity</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={lightPollutionOpacity}
            onChange={(e) => setLightPollutionOpacity(parseFloat(e.target.value))}
            className="w-full h-1 bg-cosmic-700 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="text-xs text-cosmic-400 mt-1 text-center">
            {Math.round(lightPollutionOpacity * 100)}%
          </div>
          <p className="text-xs text-cosmic-500 mt-2">VIIRS 2022 Satellite Data</p>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <div className="bg-cosmic-900/90 backdrop-blur-xl border border-primary/20 rounded-lg p-3 shadow-lg max-w-[200px]">
          <p className="text-xs font-semibold text-foreground mb-2">Light Pollution Level</p>
          <div className="flex flex-col gap-2">
            <div className="h-4 w-full bg-gradient-to-r from-[#000033] via-[#1a4d8f] via-[#4d9933] via-[#ffcc00] via-[#ff6600] to-[#ff0000] rounded"></div>
            <div className="flex justify-between text-xs text-cosmic-300">
              <span>Dark</span>
              <span>Moderate</span>
              <span>Bright</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-cosmic-700">
            <p className="text-xs text-cosmic-400">VIIRS 2022 Satellite Data</p>
            <p className="text-xs text-cosmic-500">NASA/NOAA Partnership</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityMap;

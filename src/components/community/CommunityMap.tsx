
import React, { useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import CommunityMapMarker from "./CommunityMapMarker";
import { useUserGeolocation } from "@/hooks/community/useUserGeolocation";
import CommunityUserLocationMarker from "./CommunityUserLocationMarker";
import MapClickHandler from "../location/map/MapClickHandler";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Layers } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Available light pollution tile sources
const LIGHT_POLLUTION_SOURCES = [
  {
    name: "VIIRS 2022",
    url: "https://tiles.lightpollutionmap.info/VIIRS_2022/{z}/{x}/{y}.png",
    attribution: 'Light pollution data © <a href="https://lightpollutionmap.info">lightpollutionmap.info</a>',
  },
  {
    name: "VIIRS 2021", 
    url: "https://tiles.lightpollutionmap.info/VIIRS_2021/{z}/{x}/{y}.png",
    attribution: 'Light pollution data © <a href="https://lightpollutionmap.info">lightpollutionmap.info</a>',
  },
];

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
  const [showLightPollution, setShowLightPollution] = useState(true);
  const [lightPollutionOpacity, setLightPollutionOpacity] = useState(0.6);
  const [selectedSource, setSelectedSource] = useState(0);

  const handleLocationUpdate = (lat: number, lng: number) => {
    updatePosition(lat, lng);
    if (onLocationUpdate) {
      onLocationUpdate(lat, lng);
    }
  };

  const handleSourceChange = (index: number) => {
    setSelectedSource(index);
    toast.success(`Switched to ${LIGHT_POLLUTION_SOURCES[index].name}`);
  };

  const currentSource = LIGHT_POLLUTION_SOURCES[selectedSource];

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
        
        {/* Light Pollution Overlay Layer */}
        {showLightPollution && (
          <TileLayer
            key={`light-pollution-${selectedSource}`}
            url={currentSource.url}
            opacity={lightPollutionOpacity}
            maxZoom={19}
            attribution={currentSource.attribution}
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

      {/* Light Pollution Layer Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowLightPollution(!showLightPollution)}
            className="bg-cosmic-900/90 backdrop-blur-xl border border-primary/20 hover:border-primary/40 shadow-lg gap-2"
            title={showLightPollution ? "Hide light pollution layer" : "Show light pollution layer"}
          >
            {showLightPollution ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span className="text-xs">Light Pollution</span>
          </Button>
          
          {showLightPollution && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-cosmic-900/90 backdrop-blur-xl border border-primary/20 hover:border-primary/40 shadow-lg"
                  title="Change light pollution data source"
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-cosmic-900/95 backdrop-blur-xl border-primary/20">
                {LIGHT_POLLUTION_SOURCES.map((source, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => handleSourceChange(index)}
                    className={`cursor-pointer ${selectedSource === index ? 'bg-primary/20' : ''}`}
                  >
                    {source.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {showLightPollution && (
          <div className="bg-cosmic-900/90 backdrop-blur-xl border border-primary/20 rounded-lg p-3 shadow-lg">
            <label className="text-xs text-cosmic-200 mb-2 block">Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={lightPollutionOpacity}
              onChange={(e) => setLightPollutionOpacity(parseFloat(e.target.value))}
              className="w-full h-1 bg-cosmic-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="text-xs text-cosmic-400 mt-1 text-center">
              {Math.round(lightPollutionOpacity * 100)}%
            </div>
            <div className="text-xs text-cosmic-400 mt-2 text-center">
              Source: {currentSource.name}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLightPollution && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-cosmic-900/90 backdrop-blur-xl border border-primary/20 rounded-lg p-3 shadow-lg max-w-[200px]">
          <p className="text-xs font-semibold text-foreground mb-2">Light Pollution Scale</p>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex flex-col gap-0.5">
              <div className="h-3 w-full bg-gradient-to-r from-black via-blue-900 via-yellow-600 to-white rounded"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-cosmic-400 mt-1">
            <span>Dark</span>
            <span>Bright</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityMap;


import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import CommunityMapMarker from "./CommunityMapMarker";
import { useUserGeolocation } from "@/hooks/community/useUserGeolocation";
import CommunityUserLocationMarker from "./CommunityUserLocationMarker";
import MapClickHandler from "../location/map/MapClickHandler";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, MapPin, Layers } from "lucide-react";
import DarkSkyHeatMap from "./DarkSkyHeatMap";
import LightPollutionRegionsLayer from "./LightPollutionRegionsLayer";
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
  const [showLightPollution, setShowLightPollution] = useState(true);
  const [lightPollutionOpacity, setLightPollutionOpacity] = useState(0.6);
  const [showLightPollutionRegions, setShowLightPollutionRegions] = useState(false);
  const [regionsOpacity, setRegionsOpacity] = useState(0.4);
  const [showDarkSkyHeatMap, setShowDarkSkyHeatMap] = useState(false);
  const [heatMapIntensity, setHeatMapIntensity] = useState(0.6);
  const [darkSkyLocations, setDarkSkyLocations] = useState<any[]>([]);
  const [combinedMode, setCombinedMode] = useState(false);

  useEffect(() => {
    const fetchDarkSkyLocations = async () => {
      try {
        const locations = await getAllDarkSkyLocations();
        setDarkSkyLocations(locations);
      } catch (error) {
        console.error("Error fetching dark sky locations:", error);
      }
    };
    
    if (showDarkSkyHeatMap) {
      fetchDarkSkyLocations();
    }
  }, [showDarkSkyHeatMap]);

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
        
        {/* Light Pollution Overlay Layer */}
        {showLightPollution && (
          <TileLayer
            url="https://tiles.lightpollutionmap.info/VIIRS_2022/{z}/{x}/{y}.png"
            opacity={lightPollutionOpacity}
            maxZoom={19}
            attribution='Light pollution data © <a href="https://lightpollutionmap.info">lightpollutionmap.info</a>'
          />
        )}

        {/* Light Pollution Regions Layer (Calculated Bortle Scale) */}
        {(showLightPollutionRegions || combinedMode) && (
          <LightPollutionRegionsLayer opacity={regionsOpacity} />
        )}

        {/* Dark Sky Heat Map Layer */}
        {(showDarkSkyHeatMap || combinedMode) && (
          <DarkSkyHeatMap 
            locations={darkSkyLocations}
            intensity={heatMapIntensity}
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
          title={combinedMode ? "Disable combined mode" : "Enable combined mode (all layers)"}
        >
          <Layers className="h-4 w-4" />
          <span className="text-xs">Combined Mode</span>
        </Button>

        {/* Light Pollution Regions Toggle */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowLightPollutionRegions(!showLightPollutionRegions)}
          className="bg-cosmic-900/90 backdrop-blur-xl border border-primary/20 hover:border-primary/40 shadow-lg gap-2"
          title={showLightPollutionRegions ? "Hide calculated light pollution regions" : "Show calculated light pollution regions"}
        >
          {showLightPollutionRegions ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          <span className="text-xs">Bortle Regions</span>
        </Button>
        
        {showLightPollutionRegions && (
          <div className="bg-cosmic-900/90 backdrop-blur-xl border border-primary/20 rounded-lg p-3 shadow-lg">
            <label className="text-xs text-cosmic-200 mb-2 block">Region Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={regionsOpacity}
              onChange={(e) => setRegionsOpacity(parseFloat(e.target.value))}
              className="w-full h-1 bg-cosmic-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="text-xs text-cosmic-400 mt-1 text-center">
              {Math.round(regionsOpacity * 100)}%
            </div>
          </div>
        )}

        {/* Dark Sky Heat Map Toggle */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowDarkSkyHeatMap(!showDarkSkyHeatMap)}
          className="bg-cosmic-900/90 backdrop-blur-xl border border-primary/20 hover:border-primary/40 shadow-lg gap-2"
          title={showDarkSkyHeatMap ? "Hide dark sky heat map" : "Show dark sky heat map"}
        >
          <MapPin className="h-4 w-4" />
          <span className="text-xs">Dark Sky Heat Map</span>
        </Button>
        
        {showDarkSkyHeatMap && (
          <div className="bg-cosmic-900/90 backdrop-blur-xl border border-primary/20 rounded-lg p-3 shadow-lg">
            <label className="text-xs text-cosmic-200 mb-2 block">Intensity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={heatMapIntensity}
              onChange={(e) => setHeatMapIntensity(parseFloat(e.target.value))}
              className="w-full h-1 bg-cosmic-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="text-xs text-cosmic-400 mt-1 text-center">
              {Math.round(heatMapIntensity * 100)}%
            </div>
          </div>
        )}
        
        {/* Light Pollution Layer Toggle */}
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
          </div>
        )}
      </div>

      {/* Legends */}
      <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
        {/* Light Pollution Tile Layer Legend */}
        {showLightPollution && (
          <div className="bg-cosmic-900/90 backdrop-blur-xl border border-primary/20 rounded-lg p-3 shadow-lg max-w-[200px]">
            <p className="text-xs font-semibold text-foreground mb-2">Light Pollution (Satellite)</p>
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

        {/* Bortle Scale Regions Legend */}
        {(showLightPollutionRegions || combinedMode) && (
          <div className="bg-cosmic-900/90 backdrop-blur-xl border border-primary/20 rounded-lg p-3 shadow-lg max-w-[200px]">
            <p className="text-xs font-semibold text-foreground mb-2">Bortle Scale (Calculated)</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-3 rounded" style={{ backgroundColor: '#001a33' }}></div>
                <span className="text-cosmic-300">1-2: Excellent</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-3 rounded" style={{ backgroundColor: '#0066cc' }}></div>
                <span className="text-cosmic-300">3-4: Good</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-3 rounded" style={{ backgroundColor: '#ffcc00' }}></div>
                <span className="text-cosmic-300">5: Moderate</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-3 rounded" style={{ backgroundColor: '#ff6600' }}></div>
                <span className="text-cosmic-300">6-7: Poor</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-3 rounded" style={{ backgroundColor: '#cc0000' }}></div>
                <span className="text-cosmic-300">8-9: Very Poor</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityMap;

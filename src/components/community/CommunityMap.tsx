
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
  const [regionsOpacity, setRegionsOpacity] = useState(0.4);
  const [darkSkyLocations, setDarkSkyLocations] = useState<any[]>([]);
  const [combinedMode, setCombinedMode] = useState(false);
  const [calculationProgress, setCalculationProgress] = useState<{
    current: number;
    total: number;
    percentage: number;
  } | null>(null);

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

  // Start background calculation on mount
  useEffect(() => {
    const initBackgroundCalculation = async () => {
      const { startBackgroundCalculation } = await import('@/services/globalLightPollutionService');
      
      const cleanup = startBackgroundCalculation(
        (current, total, percentage) => {
          setCalculationProgress({ current, total, percentage });
        },
        () => {
          console.log('Background calculation completed');
          setCalculationProgress(null);
        }
      );

      return cleanup;
    };

    let cleanupFn: (() => void) | undefined;
    
    initBackgroundCalculation().then(cleanup => {
      cleanupFn = cleanup;
    });

    return () => {
      cleanupFn?.();
    };
  }, []);

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
        
        {/* Light Pollution Regions Layer (Always visible - Calculated Bortle Scale) */}
        <LightPollutionRegionsLayer opacity={regionsOpacity} />

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
          title={combinedMode ? "Hide dark sky heat map" : "Show dark sky heat map overlay"}
        >
          <Layers className="h-4 w-4" />
          <span className="text-xs">Combined View</span>
        </Button>

        {/* Region Opacity Control */}
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

        {/* Calculation Progress */}
        {calculationProgress && (
          <div className="bg-cosmic-900/90 backdrop-blur-xl border border-primary/20 rounded-lg p-3 shadow-lg">
            <p className="text-xs font-semibold text-cosmic-200 mb-1">Calculating Data</p>
            <div className="w-full bg-cosmic-700 rounded-full h-1.5 mb-1">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${calculationProgress.percentage}%` }}
              />
            </div>
            <p className="text-xs text-cosmic-400">
              {calculationProgress.percentage}% ({calculationProgress.current.toLocaleString()} / {calculationProgress.total.toLocaleString()})
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <div className="bg-cosmic-900/90 backdrop-blur-xl border border-primary/20 rounded-lg p-3 shadow-lg max-w-[200px]">
          <p className="text-xs font-semibold text-foreground mb-2">Bortle Dark Sky Scale</p>
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
      </div>
    </div>
  );
};

export default CommunityMap;

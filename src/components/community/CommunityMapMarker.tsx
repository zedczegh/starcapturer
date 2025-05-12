
import React, { useState, useEffect, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useNavigate } from "react-router-dom";
import TakahashiMarkerSVG from "./TakahashiMarkerSVG";
import SiqsScoreBadge from "@/components/photoPoints/cards/SiqsScoreBadge";
import RealTimeSiqsProvider from "@/components/photoPoints/cards/RealTimeSiqsProvider";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

function createCommunityMarkerIcon(isHovered: boolean, isMobile: boolean): L.DivIcon {
  const size = isMobile ? (isHovered ? 28 : 20) : (isHovered ? 32 : 26);
  
  // Create the HTML for the icon, but we'll render the actual telescope SVG in the DOM
  return L.divIcon({
    className: "community-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="
            width:${size}px;
            height:${size}px;
            border-radius:50%;
            background:rgba(30,174,219,0.93);
            display:flex;
            align-items:center;
            justify-content:center;
            border:2px solid #fff;
            box-shadow:0 2px 6px rgba(0,0,0,0.20);
        ">
        <div id="telescope-icon-container"></div>
      </div>
    `,
  });
}

type CommunityMapMarkerProps = {
  spot: SharedAstroSpot;
  isHovered: boolean;
  isMobile: boolean;
  onMarkerClick?: (spot: SharedAstroSpot) => void;
};

const CommunityMapMarker: React.FC<CommunityMapMarkerProps> = ({
  spot,
  isHovered,
  isMobile,
  onMarkerClick,
}) => {
  const navigate = useNavigate();
  const icon = createCommunityMarkerIcon(isHovered, isMobile);
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [loadingSiqs, setLoadingSiqs] = useState<boolean>(false);
  const [siqsConfidence, setSiqsConfidence] = useState<number>(7);
  const [openPopup, setOpenPopup] = useState<boolean>(false);
  const [forceUpdate, setForceUpdate] = useState<boolean>(false);
  const markerRef = useRef<L.Marker>(null);
  
  // Stabilize SIQS score to prevent flicker
  const [stabilizedScore, setStabilizedScore] = useState<number | null>(null);
  
  useEffect(() => {
    if (realTimeSiqs !== null && realTimeSiqs > 0) {
      setStabilizedScore(realTimeSiqs);
    }
  }, [realTimeSiqs]);
  
  // Handler for SIQS calculation results
  const handleSiqsCalculated = (siqs: number | null, loading: boolean, confidence?: number) => {
    setRealTimeSiqs(siqs);
    setLoadingSiqs(loading);
    if (confidence) {
      setSiqsConfidence(confidence);
    }
    if (siqs === null && !loading) {
      setTimeout(() => setForceUpdate(true), 2000);
      setTimeout(() => setForceUpdate(false), 2100);
    }
  };

  const handleClick = () => {
    // Log click for debugging
    console.log("Marker clicked for spot:", spot.id, spot.name);
    
    if (onMarkerClick) {
      // Use the provided click handler for custom navigation
      onMarkerClick(spot);
    } else {
      // Open popup when clicked on mobile
      if (isMobile) {
        setOpenPopup(true);
        if (markerRef.current) {
          markerRef.current.openPopup();
        }
      } else {
        // Navigate directly on desktop
        navigateToSpotProfile();
      }
    }
  };

  // Navigation function to ensure consistent navigation
  const navigateToSpotProfile = () => {
    if (!spot || !spot.id) {
      console.error("Invalid spot data:", spot);
      return;
    }
    
    // Always generate a unique timestamp for each navigation
    const timestamp = Date.now();
    
    navigate(`/astro-spot/${spot.id}`, { 
      state: { 
        from: "community", 
        spotId: spot.id,
        timestamp, // Essential for forcing component remount
        fromMarker: true // Flag to indicate navigation from marker popup
      },
      replace: false // Important to create new history entry
    });
    console.log("Direct navigation to spot from marker:", spot.id, timestamp);
  };

  // Handle popup close
  const handlePopupClose = () => {
    setOpenPopup(false);
  };

  // Display the best available score
  const displayScore = stabilizedScore ?? realTimeSiqs ?? spot.siqs;

  return (
    <Marker
      position={[spot.latitude, spot.longitude]}
      icon={icon}
      eventHandlers={{
        click: handleClick
      }}
      ref={markerRef}
    >
      <Popup
        closeOnClick={false}
        onClose={handlePopupClose}
      >
        <div className={`community-popup px-1 py-2 ${isMobile ? 'min-w-[200px]' : ''}`}>
          <div className="text-base font-medium mb-1">{spot.name}</div>
          <div className="text-xs text-muted-foreground mb-2">
            {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
          </div>
          
          {/* SIQS Score Display */}
          <div className="flex items-center mb-2">
            <SiqsScoreBadge 
              score={displayScore} 
              loading={loadingSiqs && !stabilizedScore}
              confidenceScore={siqsConfidence}
            />
          </div>
          
          {/* View Profile Button */}
          <Button 
            size="sm" 
            className={`w-full text-xs flex items-center justify-center gap-1 mt-1 ${isMobile ? 'py-3' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              // Use the timestamp technique for unique navigation state
              const timestamp = Date.now();
              navigate(`/astro-spot/${spot.id}`, { 
                state: { 
                  from: "community", 
                  spotId: spot.id,
                  timestamp, // Essential for forcing component remount
                  fromMarker: true // Flag to indicate coming from a marker popup
                },
                replace: false 
              });
              console.log("Popup button navigation to spot:", spot.id, timestamp);
            }}
          >
            <ExternalLink size={14} />
            View Profile
          </Button>
          
          {/* Hidden SIQS Provider Component */}
          <RealTimeSiqsProvider
            isVisible={openPopup || !isMobile}
            latitude={spot.latitude}
            longitude={spot.longitude}
            bortleScale={spot.bortleScale}
            existingSiqs={spot.siqs}
            onSiqsCalculated={handleSiqsCalculated}
            priorityLevel={openPopup ? 'high' : 'medium'}
            debugLabel={`community-${spot.id.substring(0, 6)}`}
            forceUpdate={forceUpdate}
          />
        </div>
      </Popup>
    </Marker>
  );
};

export default React.memo(CommunityMapMarker);

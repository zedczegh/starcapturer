import React, { useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useNavigate } from "react-router-dom";
import TakahashiMarkerSVG from "./TakahashiMarkerSVG";
import SiqsScoreBadge from "@/components/photoPoints/cards/SiqsScoreBadge";
import RealTimeSiqsProvider from "@/components/photoPoints/cards/RealTimeSiqsProvider";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { getSiqsScore } from '@/utils/siqsHelpers';

function createCommunityMarkerIcon(isHovered: boolean, isMobile: boolean): L.DivIcon {
  const size = isMobile ? (isHovered ? 28 : 20) : (isHovered ? 32 : 26);
  
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
  
  const handleSiqsCalculated = (siqs: number | null, loading: boolean) => {
    setRealTimeSiqs(siqs);
    setLoadingSiqs(loading);
  };

  const handleClick = () => {
    if (onMarkerClick) {
      onMarkerClick(spot);
    } else {
      navigate(`/astro-spot/${spot.id}`, { state: { from: "community" } });
    }
  };

  const spotSiqsScore = realTimeSiqs !== null ? 
    getSiqsScore(realTimeSiqs) : 
    getSiqsScore(spot.siqs);

  return (
    <Marker
      position={[spot.latitude, spot.longitude]}
      icon={icon}
      onClick={handleClick}
    >
      <Popup>
        <div className="community-popup px-1 py-2">
          <div className="text-base font-medium mb-1">{spot.name}</div>
          <div className="text-xs text-muted-foreground mb-2">
            {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
          </div>
          
          <div className="flex items-center mb-2">
            <SiqsScoreBadge 
              score={spotSiqsScore} 
              loading={loadingSiqs} 
            />
          </div>
          
          <Button 
            size="sm" 
            className="w-full text-xs flex items-center justify-center gap-1 mt-1"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/astro-spot/${spot.id}`, { state: { from: "community" } });
            }}
          >
            <ExternalLink size={14} />
            View Profile
          </Button>
          
          <RealTimeSiqsProvider
            isVisible={true}
            latitude={spot.latitude}
            longitude={spot.longitude}
            bortleScale={spot.bortleScale}
            existingSiqs={spot.siqs}
            onSiqsCalculated={handleSiqsCalculated}
          />
        </div>
      </Popup>
    </Marker>
  );
};

export default CommunityMapMarker;

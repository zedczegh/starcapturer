
// This file serves as a backup of all marker components for testing and reference purposes.
// DO NOT DELETE OR MODIFY THIS FILE without careful consideration.

import React, { useCallback, useState, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsScore } from '@/utils/siqsHelpers';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink, Star, Telescope } from "lucide-react";
import { prepareLocationForNavigation } from '@/utils/locationNavigation';

/**
 * USER LOCATION MARKER
 */
export const BackupUserLocationMarker = React.memo(({ 
  position, 
  currentSiqs 
}: { 
  position: [number, number]; 
  currentSiqs?: number | null;
}) => {
  // This is a backup of the UserLocationMarker component
  return (
    <Marker position={position}>
      <Popup>
        <div>Your Location</div>
      </Popup>
    </Marker>
  );
});

/**
 * LOCATION MARKER
 */
export const BackupLocationMarker = React.memo(({ 
  location, 
  onClick,
  isHovered,
  onHover,
  locationId,
  isCertified,
  activeView
}: { 
  location: SharedAstroSpot;
  onClick: (location: SharedAstroSpot) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  locationId: string;
  isCertified: boolean;
  activeView: 'certified' | 'calculated';
}) => {
  // This is a backup of the LocationMarker component
  return (
    <Marker
      position={[location.latitude, location.longitude]}
      onClick={() => onClick(location)}
    >
      <Popup>
        <div>{location.name}</div>
      </Popup>
    </Marker>
  );
});

/**
 * COMMUNITY MARKER
 */
export const BackupCommunityMapMarker = React.memo(({
  spot,
  isHovered,
  isMobile,
  onMarkerClick
}: {
  spot: SharedAstroSpot;
  isHovered: boolean;
  isMobile: boolean;
  onMarkerClick?: (spot: SharedAstroSpot) => void;
}) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onMarkerClick) {
      onMarkerClick(spot);
    } else {
      navigate(`/astro-spot/${spot.id}`, { state: { from: "community" } });
    }
  };

  return (
    <Marker
      position={[spot.latitude, spot.longitude]}
      onClick={handleClick}
    >
      <Popup>
        <div>{spot.name}</div>
      </Popup>
    </Marker>
  );
});

/**
 * TAKAHASHI MARKER SVG
 */
export const BackupTakahashiMarkerSVG = ({ 
  size = 20,
  color = "#fff" 
}: { 
  size?: number;
  color?: string;
}) => {
  return <Telescope size={size} color={color} strokeWidth={2} />;
};

/**
 * MARKER EVENT HANDLER
 */
export const BackupMarkerEventHandler = ({ 
  marker, 
  eventMap 
}: { 
  marker: L.Marker | null;
  eventMap: {
    mouseover?: () => void;
    mouseout?: () => void;
    touchstart?: (e: any) => void;
    touchend?: (e: any) => void;
    touchmove?: (e: any) => void;
  };
}) => {
  useEffect(() => {
    if (!marker) return;

    const el = marker.getElement();
    if (!el) return;

    Object.entries(eventMap).forEach(([event, handler]) => {
      if (handler) {
        el.addEventListener(event, handler);
      }
    });

    return () => {
      Object.entries(eventMap).forEach(([event, handler]) => {
        if (handler) {
          el.removeEventListener(event, handler);
        }
      });
    };
  }, [marker, eventMap]);

  return null;
};

/**
 * CUSTOM MARKER CREATION UTILITIES
 */
export const BackupMarkerUtils = {
  createCustomMarker: (
    color: string = '#4ADE80',
    shape: 'circle' | 'star' = 'circle',
    sizeMultiplier: number = 1.0
  ): L.DivIcon | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const baseSize = 24 * sizeMultiplier;
      let html = '';
      
      // Apply hardware acceleration and optimize rendering
      const styleOptimizations = 'will-change: transform; transform: translateZ(0); backface-visibility: hidden;';
      
      if (shape === 'star') {
        html = `
          <svg xmlns="http://www.w3.org/2000/svg" 
               width="${baseSize}" height="${baseSize}" 
               viewBox="0 0 24 24" 
               style="${styleOptimizations}"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" 
                     fill="${color}" 
                     stroke="#FFFFFF" 
                     stroke-width="1" 
                     stroke-linejoin="round"
            />
          </svg>
        `;
      } else {
        html = `
          <svg xmlns="http://www.w3.org/2000/svg" 
               width="${baseSize}" height="${baseSize}" 
               viewBox="0 0 24 24"
               style="${styleOptimizations}"
          >
            <circle cx="12" cy="12" r="10" 
                    fill="${color}" 
                    stroke="#FFFFFF" 
                    stroke-width="1"
            />
          </svg>
        `;
      }
  
      return L.divIcon({
        className: "custom-marker-icon",
        iconAnchor: [baseSize/2, baseSize/2],
        popupAnchor: [0, -baseSize/2],
        html: html,
        iconSize: [baseSize, baseSize]
      });
    } catch (error) {
      console.error("Error creating custom marker:", error);
      return new L.Icon.Default();
    }
  },
  
  createCommunityMarkerIcon: (isHovered: boolean, isMobile: boolean): L.DivIcon => {
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
  },
  
  getSiqsClass: (siqs?: number | null): string => {
    if (siqs === undefined || siqs === null || siqs <= 0) return '';
    if (siqs >= 7.5) return 'siqs-excellent';
    if (siqs >= 5.5) return 'siqs-good';
    return 'siqs-poor';
  },
  
  getCertificationColor: (location: SharedAstroSpot): string => {
    if (!location.isDarkSkyReserve && !location.certification) {
      return 'rgba(74, 222, 128, 0.85)'; // Default green with transparency
    }
    
    const certification = (location.certification || '').toLowerCase();
    
    if (certification.includes('community')) {
      return 'rgba(255, 215, 0, 0.85)'; // Gold for Dark Sky Community #FFD700
    } else if (certification.includes('reserve') || certification.includes('sanctuary') || location.isDarkSkyReserve) {
      return 'rgba(155, 135, 245, 0.85)'; // Purple for reserves #9b87f5
    } else if (certification.includes('park')) {
      return 'rgba(74, 222, 128, 0.85)'; // Green for Dark Sky Park #4ADE80
    } else if (certification.includes('urban') || certification.includes('night sky place')) {
      return 'rgba(30, 174, 219, 0.85)'; // Blue for Urban Night Sky #1EAEDB
    } else if (certification.includes('lodging')) {
      return 'rgba(0, 0, 128, 0.85)'; // Navy blue for Dark Sky Lodging
    } else {
      return 'rgba(155, 135, 245, 0.85)'; // Default to reserve color
    }
  }
};

/**
 * MAP MARKER POPUP CONTENT
 */
export const BackupLocationPopupContent = React.memo(({
  location,
  siqsScore,
  siqsLoading,
  displayName,
  isCertified,
  onViewDetails
}: {
  location: SharedAstroSpot;
  siqsScore: number | null;
  siqsLoading: boolean;
  displayName: string;
  isCertified: boolean;
  onViewDetails: (location: SharedAstroSpot) => void;
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [stabilizedScore, setStabilizedScore] = useState<number | null>(null);
  
  useEffect(() => {
    if (siqsScore !== null && siqsScore > 0) {
      setStabilizedScore(siqsScore);
    }
  }, [siqsScore]);

  const hasValidScore = stabilizedScore !== null || (siqsScore !== null && siqsScore > 0);

  return (
    <Popup 
      closeOnClick={false}
      autoClose={false}
      offset={[0, 10]}
      direction="bottom"
    >
      <div className="py-2 px-0.5 max-w-[220px]">
        <div className="font-medium text-sm mb-1.5 flex items-center">
          {isCertified && (
            <Star className="h-3.5 w-3.5 mr-1 text-primary fill-primary" />
          )}
          <span className="text-gray-100">{displayName}</span>
        </div>
        
        {isCertified && location.certification && (
          <div className="mt-1 text-xs font-medium text-primary flex items-center">
            <Star className="h-3 w-3 mr-1" />
            {location.certification}
          </div>
        )}
        
        <div className="mt-2 text-center">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(location);
            }}
            className={`text-xs flex items-center justify-center w-full bg-primary/20 hover:bg-primary/30 text-primary-foreground ${isMobile ? 'py-3' : 'py-1.5'} px-2 rounded transition-colors`}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            {t("View Details", "查看详情")}
          </button>
        </div>
      </div>
    </Popup>
  );
});

// Export all components
export const MarkerBackup = {
  UserLocationMarker: BackupUserLocationMarker,
  LocationMarker: BackupLocationMarker,
  CommunityMapMarker: BackupCommunityMapMarker,
  TakahashiMarkerSVG: BackupTakahashiMarkerSVG,
  MarkerEventHandler: BackupMarkerEventHandler,
  MarkerUtils: BackupMarkerUtils,
  LocationPopupContent: BackupLocationPopupContent
};

export default MarkerBackup;

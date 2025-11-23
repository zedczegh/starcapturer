
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMapProvider } from '@/contexts/MapProviderContext';
import { MapContainer, TileLayer, Marker, useMap, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '@/components/photoPoints/map/AMapStyles.css';
import L from 'leaflet';
import { createCustomMarker } from './map/MapMarkerUtils';
import MapTooltip from './map/MapTooltip';
import MapClickHandler from '../location/map/MapClickHandler';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import SiqsScoreBadge from '@/components/photoPoints/cards/SiqsScoreBadge';
import RealTimeSiqsProvider from '@/components/photoPoints/cards/RealTimeSiqsProvider';
import CreateAstroSpotDialog from '@/components/astro-spots/CreateAstroSpotDialog';
import { getEnhancedLocationDetails } from '@/services/geocoding/enhancedReverseGeocoding';
import { MapPin, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MapDisplayProps {
  position: [number, number];
  locationName: string;
  editable?: boolean;
  onMapReady?: () => void;
  onMapClick?: (lat: number, lng: number) => void;
  showInfoPanel?: boolean;
  isDarkSkyReserve?: boolean;
  certification?: string;
  siqs?: number;
}

// Leaflet Map Component
const LeafletMapDisplay: React.FC<MapDisplayProps> = ({
  position,
  locationName,
  editable = false,
  onMapReady,
  onMapClick,
  isDarkSkyReserve = false,
  certification = '',
  siqs
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(siqs || null);
  const [siqsLoading, setSiqsLoading] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Custom marker icon
  const markerColor = isDarkSkyReserve || certification ? '#8b5cf6' : '#e11d48';
  const markerIcon = createCustomMarker(markerColor);

  const handleSiqsCalculated = useCallback((siqsValue: number | null, loading: boolean) => {
    setRealTimeSiqs(siqsValue);
    setSiqsLoading(loading);
  }, []);

  const handleRefreshSiqs = () => {
    setForceUpdate(true);
    setTimeout(() => setForceUpdate(false), 100);
  };

  const handleOpenDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);
  
  // MapReady component to handle initialization
  const MapReady = () => {
    const map = useMap();
    
    useEffect(() => {
      // Store map reference
      mapRef.current = map;
      
      // Remove attribution control if it exists
      if (map.attributionControl) {
        map.removeControl(map.attributionControl);
      }
      
      // Call onMapReady callback
      if (onMapReady) {
        onMapReady();
      }
    }, [map]);
    
    return null;
  };
  
  return (
    <>
      <RealTimeSiqsProvider
        isVisible={true}
        latitude={position[0]}
        longitude={position[1]}
        onSiqsCalculated={handleSiqsCalculated}
        forceUpdate={forceUpdate}
      />
      
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        className="z-0"
        attributionControl={false}
      >
        <TileLayer
          attribution=""
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker 
          position={position} 
          icon={markerIcon}
        >
          <Popup>
            <div className="p-3 min-w-[200px] bg-gradient-to-br from-cosmic-900/98 to-cosmic-800/95 rounded-lg shadow-xl border border-primary/20">
              <div className="font-medium text-sm mb-2 flex items-center text-foreground">
                <MapPin className="h-4 w-4 mr-1 text-primary" />
                {locationName}
              </div>
              
              <div className="mb-2">
                <div className="text-xs text-muted-foreground mt-1">
                  {position[0].toFixed(4)}, {position[1].toFixed(4)}
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <SiqsScoreBadge 
                  score={realTimeSiqs} 
                  compact={true}
                  loading={siqsLoading}
                />
              </div>

              {user && (
                <button
                  onClick={handleOpenDialog}
                  className="text-xs flex items-center justify-center w-full bg-gradient-to-br from-primary/80 to-accent/80 text-white py-2 px-2 rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] shadow-md shadow-primary/30 border border-primary/20"
                >
                  {t("创建我的观星点", "Create My Spot")} / {t("Create My Spot", "创建我的观星点")}
                </button>
              )}
            </div>
          </Popup>
        </Marker>
        
        {/* Map initialization event */}
        <MapReady />
        
        {/* Map click handler */}
        {editable && onMapClick && (
          <MapClickHandler onClick={onMapClick} />
        )}
      </MapContainer>
      
      {user && isDialogOpen && (
        <CreateAstroSpotDialog
          latitude={position[0]}
          longitude={position[1]}
          defaultName={locationName || t("My Spot", "我的地点")}
          onClose={handleCloseDialog}
        />
      )}
    </>
  );
};

// AMap Component
const AMapDisplay: React.FC<MapDisplayProps> = ({
  position,
  locationName,
  editable = false,
  onMapReady,
  onMapClick,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [siqsLoading, setSiqsLoading] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailedLocationName, setDetailedLocationName] = useState<string>(locationName);

  const handleSiqsCalculated = useCallback((siqsValue: number | null, loading: boolean) => {
    setRealTimeSiqs(siqsValue);
    setSiqsLoading(loading);
  }, []);

  const handleRefreshSiqs = () => {
    setForceUpdate(true);
    setTimeout(() => setForceUpdate(false), 100);
  };

  // Fetch detailed location name using AMap when available
  useEffect(() => {
    const fetchLocationName = async () => {
      try {
        // Try AMap Geocoder first if available
        if (typeof window !== 'undefined' && (window as any).AMap) {
          const amapResult = await new Promise<string | null>((resolve) => {
            (window as any).AMap.plugin('AMap.Geocoder', function() {
              const geocoder = new (window as any).AMap.Geocoder({ 
                city: '全国', 
                radius: 1000,
                extensions: 'all'
              });
              
              geocoder.getAddress([position[1], position[0]], (status: string, result: any) => {
                if (status === 'complete' && result.regeocode) {
                  resolve(result.regeocode.formattedAddress);
                } else {
                  resolve(null);
                }
              });
            });
          });
          
          if (amapResult) {
            setDetailedLocationName(amapResult);
            return;
          }
        }
        
        // Fall back to enhanced location details
        const details = await getEnhancedLocationDetails(position[0], position[1], language === 'zh' ? 'zh' : 'en');
        setDetailedLocationName(details.formattedName || locationName);
      } catch (error) {
        console.error('Error fetching location name:', error);
      }
    };

    fetchLocationName();
  }, [position, language, locationName]);

  const createPopupContent = useCallback(() => {
    const siqsDisplay = siqsLoading 
      ? '<div class="animate-pulse bg-muted-foreground/20 rounded h-5 w-12"></div>'
      : realTimeSiqs 
        ? `<span class="text-sm font-medium ${
            realTimeSiqs >= 8 ? 'text-green-500' : 
            realTimeSiqs >= 6 ? 'text-yellow-400' : 
            realTimeSiqs >= 4 ? 'text-amber-500' : 
            realTimeSiqs >= 2 ? 'text-orange-500' : 'text-red-500'
          }">${realTimeSiqs.toFixed(1)}</span>`
        : '<span class="text-sm text-muted-foreground">--</span>';

    return `
      <div class="p-3 min-w-[200px]" style="
        font-family: system-ui, -apple-system, sans-serif; 
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      ">
        <div class="font-medium text-sm mb-2 flex items-center" style="color: #f1f5f9;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          ${detailedLocationName}
        </div>
        
        <div class="mb-2">
          <div class="text-xs" style="color: #94a3b8;">
            ${position[0].toFixed(4)}, ${position[1].toFixed(4)}
          </div>
        </div>
        
        <div class="flex items-center justify-between mb-3">
          ${siqsDisplay}
        </div>

        ${user ? `
          <button
            onclick="window.openAMapCreateSpotDialog(${position[0]}, ${position[1]}, '${detailedLocationName.replace(/'/g, "\\'")}')"
            class="text-xs flex items-center justify-center w-full py-2 px-2 rounded-lg transition-all duration-300 shadow-md border"
            style="
              background: linear-gradient(135deg, rgba(155, 135, 245, 0.3), rgba(147, 51, 234, 0.3)); 
              color: #ddd6fe; 
              box-shadow: 0 4px 6px -1px rgba(155, 135, 245, 0.3); 
              border-color: rgba(155, 135, 245, 0.4);
            "
          >
            ${t("创建我的观星点", "Create My Spot")} / ${t("Create My Spot", "创建我的观星点")}
          </button>
        ` : ''}
      </div>
    `;
  }, [realTimeSiqs, siqsLoading, detailedLocationName, position, user, t]);

  // Setup global function for dialog
  useEffect(() => {
    (window as any).openAMapCreateSpotDialog = (lat: number, lng: number, name: string) => {
      setIsDialogOpen(true);
    };

    return () => {
      delete (window as any).openAMapCreateSpotDialog;
    };
  }, []);

  // Update popup content when SIQS changes
  useEffect(() => {
    if (infoWindowRef.current && mapInstance.current) {
      infoWindowRef.current.setContent(createPopupContent());
    }
  }, [realTimeSiqs, siqsLoading, createPopupContent]);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new (window as any).AMap.Map(mapContainer.current, {
      center: [position[1], position[0]], // AMap uses [lng, lat]
      zoom: 13,
      mapStyle: 'amap://styles/whitesmoke',
      showLabel: true,
      showIndoorMap: false,
    });

    mapInstance.current = map;

    // Red marker for location
    const marker = new (window as any).AMap.Marker({
      position: [position[1], position[0]],
      icon: new (window as any).AMap.Icon({
        size: new (window as any).AMap.Size(32, 42),
        image: 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
            <path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 26 16 26s16-15 16-26c0-8.8-7.2-16-16-16z" fill="#e11d48"/>
            <circle cx="16" cy="16" r="6" fill="white"/>
          </svg>
        `),
        imageSize: new (window as any).AMap.Size(32, 42),
      }),
      title: 'Location',
      anchor: 'bottom-center',
      zIndex: 200,
    });

    map.add(marker);
    markerRef.current = marker;

    // Create InfoWindow
    const infoWindow = new (window as any).AMap.InfoWindow({
      content: createPopupContent(),
      offset: new (window as any).AMap.Pixel(0, -35),
      closeWhenClickMap: true,
    });
    infoWindowRef.current = infoWindow;

    // Add click handler to marker
    marker.on('click', () => {
      handleRefreshSiqs();
      infoWindow.open(map, marker.getPosition());
    });

    if (editable && onMapClick) {
      map.on('click', (e: any) => {
        onMapClick(e.lnglat.lat, e.lnglat.lng);
      });
    }

    if (onMapReady) {
      map.on('complete', onMapReady);
    }

    return () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update marker position when coordinates change
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setPosition([position[1], position[0]]);
    }
    if (mapInstance.current) {
      mapInstance.current.setCenter([position[1], position[0]]);
    }
  }, [position]);

  return (
    <>
      <RealTimeSiqsProvider
        isVisible={true}
        latitude={position[0]}
        longitude={position[1]}
        onSiqsCalculated={handleSiqsCalculated}
        forceUpdate={forceUpdate}
      />
      
      <div 
        ref={mapContainer} 
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        className="z-0"
      />
      
      {user && isDialogOpen && (
        <CreateAstroSpotDialog
          latitude={position[0]}
          longitude={position[1]}
          defaultName={detailedLocationName || t("My Spot", "我的地点")}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </>
  );
};

const MapDisplay: React.FC<MapDisplayProps> = (props) => {
  const { provider, isAMapReady } = useMapProvider();

  if (provider === 'amap' && isAMapReady) {
    return <AMapDisplay {...props} />;
  }

  return <LeafletMapDisplay {...props} />;
};

export default MapDisplay;

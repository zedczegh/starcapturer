
import React, { useState, useCallback } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { MapPin } from 'lucide-react';
import RealTimeSiqsProvider from '../cards/RealTimeSiqsProvider';

interface UserLocationMarkerProps {
  position: [number, number];
  currentSiqs?: number | null;
}

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ position }) => {
  const { t } = useLanguage();
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [siqsLoading, setSiqsLoading] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  
  const handleSiqsCalculated = useCallback((siqs: number | null, loading: boolean) => {
    setRealTimeSiqs(siqs);
    setSiqsLoading(loading);
  }, []);

  const handleRefreshSiqs = () => {
    setForceUpdate(true);
    setTimeout(() => setForceUpdate(false), 100);
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
      
      <Marker 
        position={position} 
        icon={createCustomMarker('#e11d48')}
        onClick={handleRefreshSiqs}
      >
        <Popup closeOnClick={false} autoClose={false}>
          <div className="p-2 min-w-[200px]">
            <div className="font-medium text-sm mb-2 flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-primary" />
              {t("Your Location", "您的位置")}
            </div>
            
            <div className="mb-2">
              <div className="text-xs text-muted-foreground">
                {position[0].toFixed(4)}, {position[1].toFixed(4)}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <SiqsScoreBadge 
                score={realTimeSiqs} 
                compact={true}
                loading={siqsLoading}
              />
              <button
                onClick={handleRefreshSiqs}
                className="text-xs text-primary hover:text-primary/80 px-2 py-1"
                disabled={siqsLoading}
              >
                {t("Refresh", "刷新")}
              </button>
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
};

export default React.memo(UserLocationMarker);

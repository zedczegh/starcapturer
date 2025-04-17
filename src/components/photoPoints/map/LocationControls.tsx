
import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LocationControlsProps {
  onGetLocation: () => void;
  onClearCache: () => void;
  loading: boolean;
  cacheCleared: boolean;
  userLocation?: { latitude: number; longitude: number } | null;
}

/**
 * Component for location control buttons
 */
const LocationControls: React.FC<LocationControlsProps> = ({ 
  onGetLocation, 
  onClearCache, 
  loading, 
  cacheCleared,
  userLocation
}) => {
  const { t } = useLanguage();
  
  return (
    <>
      <Button 
        size="sm" 
        variant="secondary"
        className="bg-cosmic-800/90 hover:bg-cosmic-700/90 shadow-md border border-cosmic-700/30 font-medium relative"
        onClick={onGetLocation}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4 mr-1" />
        )}
        {t("My Location", "我的位置")}
        
        {/* Show checkmark if location found */}
        {userLocation && (
          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border border-background shadow-sm">
            <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
          </div>
        )}
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        className={`shadow-md border border-cosmic-700/30 ${
          cacheCleared 
            ? "bg-green-800/30 text-green-400 hover:bg-green-800/40" 
            : "bg-cosmic-800/90 hover:bg-cosmic-700/90 text-primary-foreground"
        }`}
        onClick={onClearCache}
        disabled={loading || cacheCleared}
      >
        {cacheCleared ? (
          t("Cache Cleared", "已清除缓存")
        ) : (
          t("Clear Cache", "清除缓存")
        )}
      </Button>
    </>
  );
};

export default LocationControls;

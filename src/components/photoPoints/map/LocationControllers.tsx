
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LocationControllersProps {
  onGetLocation: () => void;
  onClearCache: () => void;
  loading: boolean;
  cacheCleared: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  locationUpdating?: boolean;
}

const LocationControllers: React.FC<LocationControllersProps> = ({
  onGetLocation,
  onClearCache,
  loading,
  cacheCleared,
  userLocation,
  locationUpdating = false
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex space-x-2 bg-background/95 backdrop-blur-sm rounded-lg p-1.5 shadow-lg border border-border/50">
      <Button
        size="sm"
        variant="outline"
        onClick={onGetLocation}
        className={cn(
          "h-8 px-2 bg-background/80 hover:bg-primary/10",
          locationUpdating && "bg-primary/20"
        )}
        title={t("Get current location", "获取当前位置")}
        disabled={locationUpdating}
      >
        {locationUpdating ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <MapPin className="h-4 w-4 text-primary" />
        )}
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={onClearCache}
        className={cn(
          "h-8 px-2 bg-background/80 hover:bg-primary/10",
          cacheCleared && "bg-emerald-500/20 border-emerald-500/30",
          loading && "opacity-50 cursor-not-allowed"
        )}
        disabled={loading}
        title={t("Clear cached locations", "清除缓存的位置")}
      >
        <RefreshCw className={cn(
          "h-4 w-4", 
          cacheCleared ? "text-emerald-500" : "text-muted-foreground",
          loading && "animate-spin text-primary"
        )} />
      </Button>
    </div>
  );
};

export default LocationControllers;

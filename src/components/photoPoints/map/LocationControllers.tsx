
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Locate, Trash, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LocationControllersProps {
  onGetLocation: () => void;
  onClearCache: () => void;
  loading: boolean;
  cacheCleared: boolean;
  userLocation: { latitude: number; longitude: number } | null;
}

const LocationControllers: React.FC<LocationControllersProps> = ({
  onGetLocation,
  onClearCache,
  loading,
  cacheCleared,
  userLocation
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={onGetLocation}
        disabled={loading}
        className="bg-background/90 shadow-md relative"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Locate className="h-4 w-4 mr-1" />
        )}
        {t("Current", "当前")}
        
        {/* Show checkmark if location found */}
        {userLocation && (
          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border border-background shadow-sm">
            <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
          </div>
        )}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onClearCache}
        disabled={loading}
        className={`bg-background/90 shadow-md ${cacheCleared ? "text-green-500" : ""}`}
      >
        {cacheCleared ? (
          t("Cleared!", "已清除!")
        ) : (
          <>
            <Trash className="h-4 w-4 mr-1" />
            {t("Cache", "缓存")}
          </>
        )}
      </Button>
    </div>
  );
};

export default LocationControllers;

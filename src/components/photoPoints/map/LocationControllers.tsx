
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Locate, Trash } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LocationControllersProps {
  onGetLocation: () => void;
  onClearCache: () => void;
  loading: boolean;
  cacheCleared: boolean;
}

const LocationControllers: React.FC<LocationControllersProps> = ({
  onGetLocation,
  onClearCache,
  loading,
  cacheCleared
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={onGetLocation}
        disabled={loading}
        className="bg-background/90 shadow-md"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Locate className="h-4 w-4 mr-1" />
        )}
        {t("Current", "当前")}
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

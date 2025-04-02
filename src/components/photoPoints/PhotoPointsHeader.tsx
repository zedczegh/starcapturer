
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/navigation/BackButton';

interface PhotoPointsHeaderProps {
  userLocation: { latitude: number; longitude: number } | null;
  locationLoading: boolean;
  getPosition: () => void;
}

const PhotoPointsHeader: React.FC<PhotoPointsHeaderProps> = ({
  userLocation,
  locationLoading,
  getPosition
}) => {
  const { t } = useLanguage();
  
  return (
    <>
      {/* Back Button */}
      <div className="mb-6">
        <BackButton destination="/" />
      </div>
      
      <div className="flex flex-col items-center text-center mb-8">
        <h1 className="text-3xl font-bold mb-3">
          {t("Astronomy Photo Points", "天文摄影点")}
        </h1>
        <p className="text-muted-foreground max-w-xl">
          {t(
            "Discover the best locations for astrophotography near you. Filter by certified dark sky areas or algorithmically calculated spots.",
            "发现您附近最佳的天文摄影地点。按认证暗夜区域或算法计算的位置进行筛选。"
          )}
        </p>
      </div>
      
      {/* User location section */}
      {!userLocation && (
        <div className="flex justify-center mb-8">
          <Button
            onClick={getPosition}
            className="flex items-center gap-2"
            disabled={locationLoading}
          >
            {locationLoading ? (
              <span className="animate-pulse">•••</span>
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {t("Use My Location", "使用我的位置")}
          </Button>
        </div>
      )}
    </>
  );
};

export default PhotoPointsHeader;

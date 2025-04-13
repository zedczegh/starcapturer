
import React, { useCallback } from 'react';
import ViewToggle, { PhotoPointsViewMode } from '@/components/photoPoints/ViewToggle';
import DistanceRangeSlider from '@/components/photoPoints/DistanceRangeSlider';
import { Button } from '@/components/ui/button';
import { List, Map } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PhotoPointsControlsProps {
  activeView: PhotoPointsViewMode;
  onViewChange: (view: PhotoPointsViewMode) => void;
  calculatedSearchRadius: number;
  onRadiusChange: (value: number) => void;
  showMap: boolean;
  toggleMapView: () => void;
  loading: boolean;
}

const PhotoPointsControls: React.FC<PhotoPointsControlsProps> = ({
  activeView,
  onViewChange,
  calculatedSearchRadius,
  onRadiusChange,
  showMap,
  toggleMapView,
  loading
}) => {
  const { t } = useLanguage();
  
  return (
    <>
      <ViewToggle
        activeView={activeView}
        onViewChange={onViewChange}
        loading={loading}
      />
      
      <div className="flex justify-end mb-4">
        <Button 
          onClick={toggleMapView}
          variant="outline"
          size="sm"
          className="shadow-sm hover:bg-muted/60"
        >
          {showMap ? (
            <><List className="mr-2 h-4 w-4" /> {t("Show List", "显示列表")}</>
          ) : (
            <><Map className="mr-2 h-4 w-4" /> {t("Show Map", "显示地图")}</>
          )}
        </Button>
      </div>
      
      {activeView === 'calculated' && (
        <div className="max-w-xl mx-auto mb-6">
          <DistanceRangeSlider
            currentValue={calculatedSearchRadius}
            onValueChange={onRadiusChange}
            minValue={100}
            maxValue={1000}
            stepValue={100}
          />
        </div>
      )}
      
      {showMap && (
        <div className="mb-4 text-center text-sm text-muted-foreground">
          {t(
            "Click anywhere on the map to select that location. The map will center on your current location if available.",
            "点击地图上的任意位置以选择该位置。如果可用，地图将以您当前位置为中心。"
          )}
        </div>
      )}
    </>
  );
};

export default PhotoPointsControls;

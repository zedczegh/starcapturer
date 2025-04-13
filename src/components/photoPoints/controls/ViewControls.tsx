
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { List, Map } from 'lucide-react';
import ViewToggle from '@/components/photoPoints/ViewToggle';
import DistanceRangeSlider from '@/components/photoPoints/DistanceRangeSlider';

interface ViewControlsProps {
  activeView: 'certified' | 'calculated';
  onViewChange: (view: 'certified' | 'calculated') => void;
  showMap: boolean;
  onToggleMapView: () => void;
  loading: boolean;
  calculatedSearchRadius: number;
  onRadiusChange: (radius: number) => void;
}

const ViewControls: React.FC<ViewControlsProps> = ({
  activeView,
  onViewChange,
  showMap,
  onToggleMapView,
  loading,
  calculatedSearchRadius,
  onRadiusChange
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
          onClick={onToggleMapView}
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
    </>
  );
};

export default ViewControls;

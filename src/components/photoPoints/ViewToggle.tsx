
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star, MapPin } from 'lucide-react';

export type PhotoPointsViewMode = 'certified' | 'calculated';

interface ViewToggleProps {
  activeView: PhotoPointsViewMode;
  onViewChange: (view: PhotoPointsViewMode) => void;
  certifiedCount: number;
  calculatedCount: number;
  loading?: boolean;
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  activeView,
  onViewChange,
  certifiedCount,
  calculatedCount,
  loading = false
}) => {
  const { t } = useLanguage();
  
  const handleCertifiedClick = () => {
    if (activeView !== 'certified') {
      onViewChange('certified');
    }
  };
  
  const handleCalculatedClick = () => {
    if (activeView !== 'calculated') {
      onViewChange('calculated');
    }
  };
  
  return (
    <div className="flex justify-center mb-5">
      <div className="inline-flex rounded-md shadow-sm" role="group">
        <button
          type="button"
          onClick={handleCertifiedClick}
          className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-l-lg focus:z-10 focus:ring-2 border-r
            ${activeView === 'certified' 
              ? 'text-white bg-amber-700 border-amber-700 hover:bg-amber-800'
              : 'text-gray-900 bg-white border-gray-200 hover:bg-gray-100 focus:ring-gray-100'}`}
        >
          <Star 
            className={`h-4 w-4 ${activeView === 'certified' ? 'fill-white' : ''}`} 
          />
          <span className="hidden sm:inline">
            {t("Certified Locations", "认证位置")} 
            <span className={`ml-1 font-semibold ${activeView === 'certified' ? 'text-amber-200' : 'text-gray-700'}`}>
              ({certifiedCount})
            </span>
          </span>
          <span className="sm:hidden">
            {t("Certified", "认证")} 
            <span className={`ml-1 font-semibold ${activeView === 'certified' ? 'text-amber-200' : 'text-gray-700'}`}>
              ({certifiedCount})
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={handleCalculatedClick}
          className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-r-lg focus:z-10 focus:ring-2
            ${activeView === 'calculated'
              ? 'text-white bg-primary border-primary hover:bg-primary/90' 
              : 'text-gray-900 bg-white border-gray-200 hover:bg-gray-100 focus:ring-gray-100'}`}
        >
          <MapPin className={`h-4 w-4 ${activeView === 'calculated' ? 'fill-white' : ''}`} />
          <span className="hidden sm:inline">
            {t("Calculated Locations", "计算位置")}
            <span className={`ml-1 font-semibold ${activeView === 'calculated' ? 'text-primary-100' : 'text-gray-700'}`}>
              ({calculatedCount})
            </span>
          </span>
          <span className="sm:hidden">
            {t("Calculated", "计算")}
            <span className={`ml-1 font-semibold ${activeView === 'calculated' ? 'text-primary-100' : 'text-gray-700'}`}>
              ({calculatedCount})
            </span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default ViewToggle;

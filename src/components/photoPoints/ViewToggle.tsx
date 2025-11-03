
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { BadgeCheck, MapPin, Eye } from 'lucide-react';

export type PhotoPointsViewMode = 'certified' | 'calculated' | 'obscura';

interface ViewToggleProps {
  activeView: PhotoPointsViewMode;
  onViewChange: (view: PhotoPointsViewMode) => void;
  loading?: boolean;
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  activeView,
  onViewChange,
  loading = false
}) => {
  const { t } = useLanguage();
  
  // Simplified view change handler without unnecessary checks
  const handleViewChange = (view: PhotoPointsViewMode) => {
    if (view !== activeView) {
      console.log(`ViewToggle: Switching to ${view} view`);
      onViewChange(view);
    }
  };
  
  return (
    <div className="flex justify-center mb-6 px-4">
      <div className="flex flex-col sm:flex-row gap-3 p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm w-full max-w-4xl">
        {/* Dark Sky Locations Button */}
        <Button
          variant={activeView === 'certified' ? "default" : "ghost"}
          size="lg"
          onClick={() => handleViewChange('certified')}
          disabled={activeView === 'certified'}
          className={`relative w-full min-w-[160px] group ${
            activeView === 'certified'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700'
              : 'hover:bg-amber-500/10'
          }`}
        >
          {activeView === 'certified' && (
            <div className="absolute inset-0 rounded-md opacity-20 bg-gradient-to-r from-yellow-200 to-amber-300 animate-pulse" />
          )}
          <BadgeCheck className={`h-5 w-5 mr-2 ${activeView === 'certified' ? 'text-amber-100' : 'text-amber-500'}`} />
          <span className={`font-medium ${activeView === 'certified' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`}>
            {t("Dark Sky Locations", "暗夜天空位置")}
          </span>
        </Button>
        
        {/* Recommended Near Me Button */}
        <Button
          variant={activeView === 'calculated' ? "default" : "ghost"}
          size="lg"
          onClick={() => handleViewChange('calculated')}
          disabled={activeView === 'calculated'}
          className={`relative w-full min-w-[160px] group ${
            activeView === 'calculated'
              ? 'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700'
              : 'hover:bg-purple-500/10'
          }`}
        >
          {activeView === 'calculated' && (
            <div className="absolute inset-0 rounded-md opacity-20 bg-gradient-to-r from-violet-200 to-purple-300 animate-pulse" />
          )}
          <MapPin className={`h-5 w-5 mr-2 ${activeView === 'calculated' ? 'text-purple-100' : 'text-purple-500'}`} />
          <span className={`font-medium ${activeView === 'calculated' ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`}>
            {t("Recommended Near Me", "附近推荐")}
          </span>
        </Button>
        
        {/* Obscura Locations Button */}
        <Button
          variant={activeView === 'obscura' ? "default" : "ghost"}
          size="lg"
          onClick={() => handleViewChange('obscura')}
          disabled={activeView === 'obscura'}
          className={`relative w-full min-w-[160px] group ${
            activeView === 'obscura'
              ? 'bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700'
              : 'hover:bg-cyan-500/10'
          }`}
        >
          {activeView === 'obscura' && (
            <div className="absolute inset-0 rounded-md opacity-20 bg-gradient-to-r from-cyan-200 to-teal-300 animate-pulse" />
          )}
          <Eye className={`h-5 w-5 mr-2 ${activeView === 'obscura' ? 'text-cyan-100' : 'text-cyan-500'}`} />
          <span className={`font-medium ${activeView === 'obscura' ? 'text-white' : 'text-cyan-600 dark:text-cyan-400'}`}>
            {t("Obscura Locations", "奇观位置")}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default ViewToggle;

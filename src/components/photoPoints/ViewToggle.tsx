
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { BadgeCheck, MapPin } from 'lucide-react';

export type PhotoPointsViewMode = 'certified' | 'calculated';

interface ViewToggleProps {
  activeView: PhotoPointsViewMode;
  onViewChange: (view: PhotoPointsViewMode) => void;
  loading?: boolean;
}

// Separate button components to avoid hook errors
const CertifiedButton: React.FC<{
  isActive: boolean;
  onClick: () => void;
  disabled: boolean;
}> = ({ isActive, onClick, disabled }) => {
  const { t } = useLanguage();
  
  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="lg"
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full min-w-[160px] group ${
        isActive
          ? 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700'
          : 'hover:bg-amber-500/10'
      }`}
    >
      {isActive && (
        <div className="absolute inset-0 rounded-md opacity-20 bg-gradient-to-r from-yellow-200 to-amber-300 animate-pulse" />
      )}
      <BadgeCheck className={`h-5 w-5 mr-2 ${isActive ? 'text-amber-100' : 'text-amber-500'}`} />
      <span className={`font-medium ${isActive ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`}>
        {t("Certified Dark Skies", "认证暗夜区")}
      </span>
    </Button>
  );
};

const CalculatedButton: React.FC<{
  isActive: boolean;
  onClick: () => void;
  disabled: boolean;
}> = ({ isActive, onClick, disabled }) => {
  const { t } = useLanguage();
  
  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="lg"
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full min-w-[160px] group ${
        isActive
          ? 'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700'
          : 'hover:bg-purple-500/10'
      }`}
    >
      {isActive && (
        <div className="absolute inset-0 rounded-md opacity-20 bg-gradient-to-r from-violet-200 to-purple-300 animate-pulse" />
      )}
      <MapPin className={`h-5 w-5 mr-2 ${isActive ? 'text-purple-100' : 'text-purple-500'}`} />
      <span className={`font-medium ${isActive ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`}>
        {t("Calculated Spots", "计算位置")}
      </span>
    </Button>
  );
};

const ViewToggle: React.FC<ViewToggleProps> = ({
  activeView,
  onViewChange,
  loading = false
}) => {
  const handleCertifiedClick = () => {
    if (activeView !== 'certified' && !loading) {
      console.log("ViewToggle: Switching to certified view");
      onViewChange('certified');
    }
  };
  
  const handleCalculatedClick = () => {
    if (activeView !== 'calculated' && !loading) {
      console.log("ViewToggle: Switching to calculated view");
      onViewChange('calculated');
    }
  };
  
  return (
    <div className="flex justify-center mb-6 px-4">
      <div className="flex flex-col sm:flex-row gap-3 p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm w-full max-w-xl">
        <CertifiedButton 
          isActive={activeView === 'certified'}
          disabled={loading || activeView === 'certified'}
          onClick={handleCertifiedClick}
        />
        
        <CalculatedButton
          isActive={activeView === 'calculated'}
          disabled={loading || activeView === 'calculated'}
          onClick={handleCalculatedClick}
        />
      </div>
    </div>
  );
};

export default ViewToggle;

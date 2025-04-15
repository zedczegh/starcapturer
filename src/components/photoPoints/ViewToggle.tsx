
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles, MapPin } from 'lucide-react';

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
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={`w-full ${
        isActive
          ? 'bg-gradient-to-r from-amber-500/90 to-amber-600/90 text-primary-foreground hover:from-amber-500 hover:to-amber-600'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {isActive && (
        <div
          className="absolute inset-0 rounded-md pointer-events-none"
          style={{ 
            boxShadow: '0 0 15px rgba(251, 191, 36, 0.6), inset 0 0 8px rgba(251, 191, 36, 0.4)'
          }}
        />
      )}
      <Sparkles className="h-4 w-4 mr-2" />
      <span>{t("Certified Dark Skies", "认证暗夜区")}</span>
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
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={`w-full ${
        isActive
          ? 'bg-gradient-to-r from-primary-500/90 to-primary-600/90 text-primary-foreground hover:from-primary-500 hover:to-primary-600'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {isActive && (
        <div
          className="absolute inset-0 rounded-md pointer-events-none"
          style={{ 
            boxShadow: '0 0 15px rgba(139, 92, 246, 0.6), inset 0 0 8px rgba(139, 92, 246, 0.4)'
          }}
        />
      )}
      <MapPin className="h-4 w-4 mr-2" />
      <span>{t("Calculated Spots", "计算位置")}</span>
    </Button>
  );
};

const ViewToggle: React.FC<ViewToggleProps> = ({
  activeView,
  onViewChange,
  loading = false
}) => {
  // Simple handler functions for view changes
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
    <div className="flex justify-center mb-6">
      <div className="flex bg-muted/30 p-2 rounded-lg shadow-sm border border-border/50 w-full max-w-sm">
        {/* Certified Button */}
        <div className="flex-1 mx-2">
          <CertifiedButton 
            isActive={activeView === 'certified'}
            disabled={loading || activeView === 'certified'}
            onClick={handleCertifiedClick}
          />
        </div>
        
        {/* Calculated Button */}
        <div className="flex-1 mx-2">
          <CalculatedButton
            isActive={activeView === 'calculated'}
            disabled={loading || activeView === 'calculated'}
            onClick={handleCalculatedClick}
          />
        </div>
      </div>
    </div>
  );
};

export default ViewToggle;

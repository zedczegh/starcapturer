
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

const ViewToggle: React.FC<ViewToggleProps> = ({
  activeView,
  onViewChange,
  loading = false
}) => {
  const { t } = useLanguage();
  
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
  
  // Always render both buttons, only their appearance changes based on state
  return (
    <div className="flex justify-center mb-6">
      <div className="flex bg-muted/30 p-2 rounded-lg shadow-sm border border-border/50 w-full max-w-sm">
        {/* Certified Button */}
        <div className="flex-1 mx-2">
          <Button
            variant={activeView === 'certified' ? "default" : "ghost"}
            size="sm"
            onClick={handleCertifiedClick}
            disabled={loading || activeView === 'certified'}
            className={`w-full ${
              activeView === 'certified'
                ? 'bg-gradient-to-r from-amber-500/90 to-amber-600/90 text-primary-foreground hover:from-amber-500 hover:to-amber-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {activeView === 'certified' && (
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
        </div>
        
        {/* Calculated Button */}
        <div className="flex-1 mx-2">
          <Button
            variant={activeView === 'calculated' ? "default" : "ghost"}
            size="sm"
            onClick={handleCalculatedClick}
            disabled={loading || activeView === 'calculated'}
            className={`w-full ${
              activeView === 'calculated'
                ? 'bg-gradient-to-r from-primary-500/90 to-primary-600/90 text-primary-foreground hover:from-primary-500 hover:to-primary-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {activeView === 'calculated' && (
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
        </div>
      </div>
    </div>
  );
};

export default ViewToggle;

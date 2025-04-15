
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export type PhotoPointsViewMode = 'certified' | 'calculated';

interface ViewToggleProps {
  activeView: PhotoPointsViewMode;
  onViewChange: (view: PhotoPointsViewMode) => void;
  loading?: boolean;
}

// Extract CertifiedButton as completely independent component
const CertifiedButton = ({ 
  isActive, 
  onClick, 
  disabled 
}: { 
  isActive: boolean; 
  onClick: () => void; 
  disabled: boolean;
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex-1 mx-2">
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
          <motion.div
            className="absolute inset-0 rounded-md pointer-events-none"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ 
              boxShadow: '0 0 15px rgba(251, 191, 36, 0.6), inset 0 0 8px rgba(251, 191, 36, 0.4)'
            }}
          />
        )}
        <Sparkles className="h-4 w-4 mr-2" />
        <span>{t("Certified Dark Skies", "认证暗夜区")}</span>
      </Button>
    </div>
  );
};

// Extract CalculatedButton as completely independent component
const CalculatedButton = ({ 
  isActive, 
  onClick, 
  disabled 
}: { 
  isActive: boolean; 
  onClick: () => void; 
  disabled: boolean;
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex-1 mx-2">
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
          <motion.div
            className="absolute inset-0 rounded-md pointer-events-none"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ 
              boxShadow: '0 0 15px rgba(139, 92, 246, 0.6), inset 0 0 8px rgba(139, 92, 246, 0.4)'
            }}
          />
        )}
        <MapPin className="h-4 w-4 mr-2" />
        <span>{t("Calculated Spots", "计算位置")}</span>
      </Button>
    </div>
  );
};

// Main ViewToggle component with drastically simplified implementation
const ViewToggle: React.FC<ViewToggleProps> = ({
  activeView,
  onViewChange,
  loading = false
}) => {
  // Create separate handler functions for each button to avoid conditional logic
  const handleCertifiedClick = React.useCallback(() => {
    if (!loading && activeView !== 'certified') {
      console.log("ViewToggle: Changing to certified view");
      onViewChange('certified');
    }
  }, [activeView, onViewChange, loading]);
  
  const handleCalculatedClick = React.useCallback(() => {
    if (!loading && activeView !== 'calculated') {
      console.log("ViewToggle: Changing to calculated view");
      onViewChange('calculated');
    }
  }, [activeView, onViewChange, loading]);
  
  // Add a debugging log on each render to track component lifecycle
  React.useEffect(() => {
    console.log("ViewToggle rendered, activeView:", activeView);
  }, [activeView]);
  
  return (
    <div className="flex justify-center mb-6">
      <div className="flex bg-muted/30 p-2 rounded-lg shadow-sm border border-border/50 w-full max-w-sm">
        <CertifiedButton 
          isActive={activeView === 'certified'}
          onClick={handleCertifiedClick}
          disabled={loading || activeView === 'certified'}
        />
        
        <CalculatedButton
          isActive={activeView === 'calculated'}
          onClick={handleCalculatedClick}
          disabled={loading || activeView === 'calculated'}
        />
      </div>
    </div>
  );
};

export default ViewToggle;

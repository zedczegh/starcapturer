
import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Toggle } from "@/components/ui/toggle";
import { Award, Calculator } from "lucide-react";

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
  
  // Prevent tab switching while loading
  const handleViewChange = (view: PhotoPointsViewMode) => {
    if (!loading) {
      onViewChange(view);
    }
  };
  
  return (
    <div className="flex items-center justify-center bg-cosmic-900/40 rounded-lg p-1.5 max-w-sm mx-auto gap-3">
      <Toggle
        variant="outline"
        pressed={activeView === 'certified'}
        onPressedChange={() => handleViewChange('certified')}
        disabled={loading}
        className={`flex-1 gap-1.5 ${
          activeView === 'certified' 
            ? 'bg-cosmic-800/60 border-cosmic-600/50' 
            : 'bg-transparent hover:bg-cosmic-800/40'
        }`}
      >
        <Award className="h-4.5 w-4.5 text-blue-400" />
        <span className="text-sm">{t("Certified", "认证地点")}</span>
        <span className="ml-1 text-xs text-muted-foreground">
          ({certifiedCount})
        </span>
        {loading && activeView === 'certified' && (
          <span className="ml-1 h-3 w-3">•</span>
        )}
      </Toggle>
      
      <Toggle
        variant="outline"
        pressed={activeView === 'calculated'}
        onPressedChange={() => handleViewChange('calculated')}
        disabled={loading}
        className={`flex-1 gap-1.5 ${
          activeView === 'calculated' 
            ? 'bg-cosmic-800/60 border-cosmic-600/50' 
            : 'bg-transparent hover:bg-cosmic-800/40'
        }`}
      >
        <Calculator className="h-4.5 w-4.5 text-yellow-400" />
        <span className="text-sm">{t("Calculated", "计算地点")}</span>
        <span className="ml-1 text-xs text-muted-foreground">
          ({calculatedCount})
        </span>
        {loading && activeView === 'calculated' && (
          <span className="ml-1 h-3 w-3">•</span>
        )}
      </Toggle>
    </div>
  );
};

export default ViewToggle;


import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Toggle } from "@/components/ui/toggle";
import { Award, Calculator, Loader2 } from "lucide-react";

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
  
  return (
    <div className="flex items-center justify-center bg-cosmic-900/40 rounded-lg p-1 max-w-sm mx-auto">
      <Toggle
        variant="outline"
        pressed={activeView === 'certified'}
        onPressedChange={() => onViewChange('certified')}
        disabled={loading}
        className={`flex-1 gap-1.5 ${
          activeView === 'certified' 
            ? 'bg-cosmic-800/60 border-cosmic-600/50' 
            : 'bg-transparent hover:bg-cosmic-800/40'
        }`}
      >
        <Award className="h-4 w-4 text-blue-400" />
        {t("Certified", "认证地点")}
        <span className="ml-1 text-xs text-muted-foreground">
          ({certifiedCount})
        </span>
      </Toggle>
      
      <Toggle
        variant="outline"
        pressed={activeView === 'calculated'}
        onPressedChange={() => onViewChange('calculated')}
        disabled={loading}
        className={`flex-1 gap-1.5 ${
          activeView === 'calculated' 
            ? 'bg-cosmic-800/60 border-cosmic-600/50' 
            : 'bg-transparent hover:bg-cosmic-800/40'
        }`}
      >
        <Calculator className="h-4 w-4 text-yellow-400" />
        {t("Calculated", "计算地点")}
        <span className="ml-1 text-xs text-muted-foreground">
          ({calculatedCount})
        </span>
        {loading && <Loader2 className="h-3 w-3 ml-1 animate-spin" />}
      </Toggle>
    </div>
  );
};

export default ViewToggle;

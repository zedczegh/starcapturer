
import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
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
  
  // Prevent tab switching while loading
  const handleViewChange = (view: PhotoPointsViewMode) => {
    if (!loading) {
      onViewChange(view);
    }
  };
  
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
      <Button
        variant={activeView === 'certified' ? "default" : "outline"}
        onClick={() => handleViewChange('certified')}
        disabled={loading}
        size="lg"
        className={`relative w-full md:w-64 h-16 gap-3 font-semibold transition-all duration-300 ${
          activeView === 'certified' 
            ? 'bg-gradient-to-br from-blue-600 to-blue-800 border-blue-500 shadow-lg shadow-blue-500/30' 
            : 'bg-background/30 hover:bg-blue-500/20 hover:border-blue-400/40'
        }`}
      >
        <Award className={`h-6 w-6 ${activeView === 'certified' ? 'text-blue-300' : 'text-blue-400'}`} />
        <div className="flex flex-col items-start">
          <span className="text-base">{t("Certified", "认证地点")}</span>
          <span className="text-xs text-blue-200/80">
            {t("Dark sky certified locations", "黑暗天空认证地点")}
          </span>
        </div>
        <span className="absolute top-2 right-2 text-xs bg-blue-700/60 px-2 py-0.5 rounded-full">
          {certifiedCount}
        </span>
        {loading && activeView === 'certified' && (
          <Loader2 className="absolute right-3 bottom-3 h-4 w-4 animate-spin" />
        )}
      </Button>
      
      <Button
        variant={activeView === 'calculated' ? "default" : "outline"}
        onClick={() => handleViewChange('calculated')}
        disabled={loading}
        size="lg"
        className={`relative w-full md:w-64 h-16 gap-3 font-semibold transition-all duration-300 ${
          activeView === 'calculated' 
            ? 'bg-gradient-to-br from-amber-600 to-amber-800 border-amber-500 shadow-lg shadow-amber-500/30' 
            : 'bg-background/30 hover:bg-amber-500/20 hover:border-amber-400/40'
        }`}
      >
        <Calculator className={`h-6 w-6 ${activeView === 'calculated' ? 'text-amber-300' : 'text-yellow-400'}`} />
        <div className="flex flex-col items-start">
          <span className="text-base">{t("Calculated", "计算地点")}</span>
          <span className="text-xs text-amber-200/80">
            {t("AI recommended locations", "AI推荐地点")}
          </span>
        </div>
        <span className="absolute top-2 right-2 text-xs bg-amber-700/60 px-2 py-0.5 rounded-full">
          {calculatedCount}
        </span>
        {loading && activeView === 'calculated' && (
          <Loader2 className="absolute right-3 bottom-3 h-4 w-4 animate-spin" />
        )}
      </Button>
    </div>
  );
};

export default ViewToggle;

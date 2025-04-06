
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
    <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
      <Button
        variant={activeView === 'certified' ? "default" : "outline"}
        onClick={() => handleViewChange('certified')}
        disabled={loading}
        size="lg"
        className={`relative w-full md:w-60 h-14 gap-3 font-semibold transition-all duration-300 ${
          activeView === 'certified' 
            ? 'bg-blue-600/90 border-blue-500 shadow-lg shadow-blue-500/20' 
            : 'bg-background/30 hover:bg-blue-500/20'
        }`}
      >
        <Award className="h-5 w-5 text-blue-400" />
        <span className="text-base">{t("Certified", "认证地点")}</span>
        <span className="ml-1 text-xs bg-blue-700/60 px-2 py-0.5 rounded-full">
          {certifiedCount}
        </span>
        {loading && activeView === 'certified' && (
          <Loader2 className="absolute right-3 h-4 w-4 animate-spin" />
        )}
      </Button>
      
      <Button
        variant={activeView === 'calculated' ? "default" : "outline"}
        onClick={() => handleViewChange('calculated')}
        disabled={loading}
        size="lg"
        className={`relative w-full md:w-60 h-14 gap-3 font-semibold transition-all duration-300 ${
          activeView === 'calculated' 
            ? 'bg-amber-600/90 border-amber-500 shadow-lg shadow-amber-500/20' 
            : 'bg-background/30 hover:bg-amber-500/20'
        }`}
      >
        <Calculator className="h-5 w-5 text-yellow-400" />
        <span className="text-base">{t("Calculated", "计算地点")}</span>
        <span className="ml-1 text-xs bg-amber-700/60 px-2 py-0.5 rounded-full">
          {calculatedCount}
        </span>
        {loading && activeView === 'calculated' && (
          <Loader2 className="absolute right-3 h-4 w-4 animate-spin" />
        )}
      </Button>
    </div>
  );
};

export default ViewToggle;

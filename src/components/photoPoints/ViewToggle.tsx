
import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Award, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PhotoPointsViewMode = 'certified' | 'calculated';

interface ViewToggleProps {
  activeView: PhotoPointsViewMode;
  onViewChange: (view: PhotoPointsViewMode) => void;
  className?: string;
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  activeView,
  onViewChange,
  className
}) => {
  const { t } = useLanguage();
  
  return (
    <div className={cn("flex gap-2 p-1 bg-cosmic-800/40 backdrop-blur-sm rounded-xl border border-cosmic-700/30", className)}>
      <Button
        variant={activeView === 'certified' ? 'secondary' : 'ghost'}
        size="sm"
        className={cn(
          "flex-1 flex items-center gap-2 transition-all", 
          activeView === 'certified' ? "bg-cosmic-700/70" : "hover:bg-cosmic-700/40"
        )}
        onClick={() => onViewChange('certified')}
      >
        <Award className="h-4 w-4" />
        <span className="text-xs sm:text-sm truncate">
          {t("Certified Locations", "认证地点")}
        </span>
      </Button>
      
      <Button
        variant={activeView === 'calculated' ? 'secondary' : 'ghost'}
        size="sm"
        className={cn(
          "flex-1 flex items-center gap-2 transition-all", 
          activeView === 'calculated' ? "bg-cosmic-700/70" : "hover:bg-cosmic-700/40"
        )}
        onClick={() => onViewChange('calculated')}
      >
        <Calculator className="h-4 w-4" />
        <span className="text-xs sm:text-sm truncate">
          {t("Calculated Recommendations", "计算推荐")}
        </span>
      </Button>
    </div>
  );
};

export default ViewToggle;


import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { cn } from '@/lib/utils';

export type PhotoPointsViewMode = 'certified' | 'calculated';

interface ViewToggleProps {
  activeView: PhotoPointsViewMode;
  onViewChange: (view: PhotoPointsViewMode) => void;
  certifiedCount?: number;
  calculatedCount?: number;
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
  
  // Create more defensive click handlers to prevent race conditions
  const handleCertifiedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (activeView !== 'certified' && !loading) {
      onViewChange('certified');
    }
  };
  
  const handleCalculatedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (activeView !== 'calculated' && !loading) {
      onViewChange('calculated');
    }
  };

  return (
    <div className="flex justify-center mb-6">
      <div className="bg-cosmic-800/40 border border-cosmic-700/30 rounded-lg p-1 flex shadow-sm">
        <button
          onClick={handleCertifiedClick}
          disabled={loading}
          className={cn(
            "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeView === 'certified'
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-cosmic-100 hover:bg-cosmic-700/40"
          )}
          aria-current={activeView === 'certified' ? "page" : undefined}
        >
          <Star className="h-3.5 w-3.5 mr-1.5 fill-yellow-300 text-yellow-300" />
          {t("Certified", "认证")}
          {typeof certifiedCount === 'number' && (
            <Badge variant="outline" className="ml-2 bg-cosmic-700/50 text-xs">
              {certifiedCount}
            </Badge>
          )}
        </button>
        
        <button
          onClick={handleCalculatedClick}
          disabled={loading}
          className={cn(
            "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeView === 'calculated'
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-cosmic-100 hover:bg-cosmic-700/40"
          )}
          aria-current={activeView === 'calculated' ? "page" : undefined}
        >
          {t("Calculated", "计算")}
          {typeof calculatedCount === 'number' && (
            <Badge variant="outline" className="ml-2 bg-cosmic-700/50 text-xs">
              {calculatedCount}
            </Badge>
          )}
        </button>
      </div>
    </div>
  );
};

export default ViewToggle;

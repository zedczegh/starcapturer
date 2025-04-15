
import React, { useState, useRef } from 'react';
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
  const [isChangingView, setIsChangingView] = useState(false);
  const lastClickTimeRef = useRef<number>(0);
  
  // Create more defensive click handlers to prevent race conditions
  const handleCertifiedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Implement debounce and safety check
    const now = Date.now();
    if (now - lastClickTimeRef.current < 300) {
      return; // Debounce rapid clicks
    }
    lastClickTimeRef.current = now;
    
    if (activeView !== 'certified' && !loading && !isChangingView) {
      setIsChangingView(true);
      onViewChange('certified');
      
      // Reset changing state after transition completes
      setTimeout(() => {
        setIsChangingView(false);
      }, 500);
    }
  };
  
  const handleCalculatedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Implement debounce and safety check
    const now = Date.now();
    if (now - lastClickTimeRef.current < 300) {
      return; // Debounce rapid clicks
    }
    lastClickTimeRef.current = now;
    
    if (activeView !== 'calculated' && !loading && !isChangingView) {
      setIsChangingView(true);
      onViewChange('calculated');
      
      // Reset changing state after transition completes
      setTimeout(() => {
        setIsChangingView(false);
      }, 500);
    }
  };

  return (
    <div className="flex justify-center mb-6">
      <div className="bg-cosmic-800/40 border border-cosmic-700/30 rounded-lg p-1 flex shadow-sm">
        <button
          onClick={handleCertifiedClick}
          disabled={loading || isChangingView}
          aria-disabled={loading || isChangingView}
          className={cn(
            "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors relative",
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
          disabled={loading || isChangingView}
          aria-disabled={loading || isChangingView}
          className={cn(
            "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors relative",
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

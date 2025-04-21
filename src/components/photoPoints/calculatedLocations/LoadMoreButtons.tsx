
import React, { useState, useEffect } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Calculator, Loader2 } from "lucide-react";
import { toast } from 'sonner';

interface LoadMoreButtonsProps {
  hasMore: boolean;
  onLoadMore: () => void;
  canLoadMoreCalculated?: boolean;
  onLoadMoreCalculated?: () => void;
  loadMoreClickCount?: number;
  maxLoadMoreClicks?: number;
}

const LoadMoreButtons: React.FC<LoadMoreButtonsProps> = ({
  hasMore,
  onLoadMore,
  canLoadMoreCalculated = false,
  onLoadMoreCalculated,
  loadMoreClickCount = 0,
  maxLoadMoreClicks = 2
}) => {
  const { t } = useLanguage();
  const [showLoadMoreCalc, setShowLoadMoreCalc] = useState(false);
  const [loadingCalculated, setLoadingCalculated] = useState(false);
  
  // Determine whether to show the calculated load more button
  useEffect(() => {
    if (onLoadMoreCalculated && canLoadMoreCalculated && loadMoreClickCount < maxLoadMoreClicks) {
      setShowLoadMoreCalc(true);
    } else {
      setShowLoadMoreCalc(false);
    }
  }, [onLoadMoreCalculated, canLoadMoreCalculated, loadMoreClickCount, maxLoadMoreClicks]);
  
  // Handle load more calculated locations
  const handleLoadMoreCalculated = async () => {
    if (onLoadMoreCalculated) {
      setLoadingCalculated(true);
      
      try {
        await onLoadMoreCalculated();
        
        // Show progress to the user
        const remainingClicks = maxLoadMoreClicks - loadMoreClickCount - 1;
        if (remainingClicks > 0) {
          toast.info(t(
            `Loading more locations... (${remainingClicks} more loads available)`,
            `正在加载更多位置...（还可以加载${remainingClicks}次）`
          ));
        } else {
          toast.info(t(
            "Loading final batch of locations...",
            "正在加载最后一批位置..."
          ));
        }
      } finally {
        setLoadingCalculated(false);
      }
    }
  };
  
  return (
    <div className="mt-8 space-y-4">
      {/* Enhanced Load More Calculated Locations button */}
      {showLoadMoreCalc && (
        <div className="flex justify-center">
          <Button 
            variant="default" 
            onClick={handleLoadMoreCalculated}
            disabled={loadingCalculated}
            className="group sci-fi-btn bg-cosmic-700/80 hover:bg-cosmic-600/90 transition-all duration-300 py-2.5"
            size="lg"
          >
            {loadingCalculated ? (
              <>
                {t("Finding Locations...", "正在查找位置...")}
                <Loader2 className="ml-2.5 h-5 w-5 animate-spin" />
              </>
            ) : (
              <>
                {t("Find More Locations", "查找更多位置")}
                <Calculator className="ml-2.5 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </div>
      )}
      
      {/* Original load more button for pagination */}
      {hasMore && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={onLoadMore}
            className="group sci-fi-btn border-primary/40 hover:bg-cosmic-800/50 hover:opacity-90 transition-all duration-300"
          >
            {t("Load More Locations", "加载更多位置")}
            <Calculator className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default LoadMoreButtons;

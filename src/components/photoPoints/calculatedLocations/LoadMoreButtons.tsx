
import React, { useState } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Calculator, Loader2 } from "lucide-react";
import { toast } from 'sonner';

interface LoadMoreButtonsProps {
  hasMore: boolean;
  onLoadMore: () => void;
  canLoadMoreCalculated?: boolean;
  onLoadMoreCalculated?: () => void;
}

const LoadMoreButtons: React.FC<LoadMoreButtonsProps> = ({
  hasMore,
  onLoadMore,
  canLoadMoreCalculated = false,
  onLoadMoreCalculated
}) => {
  const { t } = useLanguage();
  const [loadingCalculated, setLoadingCalculated] = useState(false);

  // Handle load more calculated locations
  const handleLoadMoreCalculated = async () => {
    if (onLoadMoreCalculated) {
      setLoadingCalculated(true);
      try {
        await onLoadMoreCalculated();
        toast.info(t("Loading more locations...", "正在加载更多位置..."));
      } finally {
        setLoadingCalculated(false);
      }
    }
  };

  return (
    <div className="mt-8 space-y-4">
      {/* Load More Calculated Locations button - always visible if enabled */}
      {onLoadMoreCalculated && canLoadMoreCalculated && (
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

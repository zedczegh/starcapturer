
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from "@/contexts/LanguageContext";
import { Calculator, Loader2, Target, RefreshCw, Search } from "lucide-react";
import PhotoLocationCard from '@/components/photoPoints/PhotoLocationCard';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { Button } from "@/components/ui/button";
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

interface CalculatedLocationsProps {
  locations: SharedAstroSpot[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh?: () => void;
  searchRadius?: number;
  initialLoad?: boolean;
  onLoadMoreCalculated?: () => void;
  canLoadMoreCalculated?: boolean;
  loadMoreClickCount?: number;
  maxLoadMoreClicks?: number;
}

const CalculatedLocations: React.FC<CalculatedLocationsProps> = ({ 
  locations, 
  loading, 
  hasMore, 
  onLoadMore,
  onRefresh,
  searchRadius = 0,
  initialLoad = false,
  onLoadMoreCalculated,
  canLoadMoreCalculated = false,
  loadMoreClickCount = 0,
  maxLoadMoreClicks = 2
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [showLoadMoreCalc, setShowLoadMoreCalc] = useState(false);
  const [loadingCalculated, setLoadingCalculated] = useState(false);
  
  // Filter out locations with SIQS score of 0
  const validLocations = locations.filter(loc => loc.siqs !== undefined && loc.siqs > 0);
  
  // Sort locations by distance (closest first)
  const sortedLocations = [...validLocations].sort((a, b) => 
    (a.distance || Infinity) - (b.distance || Infinity)
  );
  
  // Determine whether to show the calculated load more button
  useEffect(() => {
    if (onLoadMoreCalculated && canLoadMoreCalculated && loadMoreClickCount < maxLoadMoreClicks) {
      setShowLoadMoreCalc(true);
    } else {
      setShowLoadMoreCalc(false);
    }
  }, [onLoadMoreCalculated, canLoadMoreCalculated, loadMoreClickCount, maxLoadMoreClicks]);
  
  // Add event listener for expanding search radius
  useEffect(() => {
    const handleExpandRadius = (e: CustomEvent<{ radius: number }>) => {
      if (onRefresh) {
        document.dispatchEvent(new CustomEvent('set-search-radius', { 
          detail: { radius: e.detail.radius } 
        }));
        setTimeout(onRefresh, 100);
      }
    };
    
    document.addEventListener('expand-search-radius', handleExpandRadius as EventListener);
    
    return () => {
      document.removeEventListener('expand-search-radius', handleExpandRadius as EventListener);
    };
  }, [onRefresh]);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: isMobile ? 0.05 : 0.1,
        when: "beforeChildren" 
      } 
    }
  };
  
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
  
  if (loading && !loadingCalculated) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }
  
  if (sortedLocations.length === 0) {
    return (
      <div className="text-center py-12 glassmorphism rounded-xl bg-cosmic-800/30 border border-cosmic-600/30">
        <Calculator className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {t("No Recommended Locations Found", "未找到推荐地点")}
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto mb-2 text-sm">
          {t(
            "We couldn't find any locations with good viewing conditions within your search radius.",
            "在您的搜索半径内，我们未能找到具有良好观测条件的地点。"
          )}
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Target className="h-4 w-4 text-primary" />
          <p className="text-sm text-primary">
            {searchRadius > 0 ? 
              t(
                `Try increasing your search radius beyond ${searchRadius}km.`,
                `尝试将搜索半径增加到${searchRadius}公里以上。`
              ) :
              t(
                "Try adjusting your search radius to find better viewing spots.",
                "尝试调整搜索半径以找到更好的观测地点。"
              )
            }
          </p>
        </div>
        
        {onRefresh && (
          <div className="mt-6 flex flex-col gap-3 items-center">
            <Button 
              variant="outline" 
              onClick={onRefresh}
              className="group border-primary/40 hover:bg-cosmic-800/50"
            >
              <RefreshCw className="mr-2 h-4 w-4 group-hover:animate-spin" />
              {t("Refresh Recommendations", "刷新推荐")}
            </Button>
            
            {searchRadius < 10000 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => {
                  // Trigger custom event to expand search radius
                  const newRadius = Math.min(10000, searchRadius + 1000);
                  document.dispatchEvent(new CustomEvent('expand-search-radius', { 
                    detail: { radius: newRadius } 
                  }));
                }}
              >
                <Search className="mr-1.5 h-3 w-3" />
                {t("Try wider search area", "尝试更广的搜索范围")}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <>
      <motion.div
        variants={containerVariants}
        initial={initialLoad ? "hidden" : "visible"}
        animate="visible"
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${isMobile ? 'content-visibility-auto' : ''}`}
      >
        {sortedLocations.map((location, index) => (
          <PhotoLocationCard
            key={location.id || `calc-loc-${index}`}
            location={location}
            index={index}
            showRealTimeSiqs={true}
            isMobile={isMobile}
          />
        ))}
      </motion.div>
      
      {/* New button for loading more calculated locations */}
      {showLoadMoreCalc && (
        <div className="flex justify-center mt-8">
          <Button 
            variant="default" 
            onClick={handleLoadMoreCalculated}
            disabled={loadingCalculated}
            className="group sci-fi-btn bg-cosmic-700/80 hover:bg-cosmic-600/90 transition-all duration-300"
          >
            {loadingCalculated ? (
              <>
                {t("Finding Locations...", "正在查找位置...")}
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              <>
                {t("Find More Locations", "查找更多位置")}
                <Calculator className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </div>
      )}
      
      {/* Original load more button for pagination */}
      {hasMore && (
        <div className="flex justify-center mt-8">
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
      
      {onRefresh && (
        <div className="flex justify-center mt-4">
          <Button 
            variant="ghost" 
            onClick={onRefresh}
            size="sm"
            className="text-xs text-muted-foreground hover:text-primary"
          >
            <RefreshCw className="mr-1.5 h-3 w-3" />
            {t("Refresh with new SIQS data", "使用新的SIQS数据刷新")}
          </Button>
        </div>
      )}
    </>
  );
};

export default CalculatedLocations;


import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from "@/contexts/LanguageContext";
import { Calculator, Loader2, Target, RefreshCw, Search, Plus, AlertCircle } from "lucide-react";
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
  // New props for load more calculated locations
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
  // New props with defaults
  onLoadMoreCalculated,
  canLoadMoreCalculated = false,
  loadMoreClickCount = 0,
  maxLoadMoreClicks = 2
}) => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const [loadingMoreCalculated, setLoadingMoreCalculated] = useState(false);
  
  // Filter out locations with SIQS score of 0
  const validLocations = locations.filter(loc => loc.siqs !== undefined && loc.siqs > 0);
  
  // Sort locations by distance (closest first)
  const sortedLocations = [...validLocations].sort((a, b) => 
    (a.distance || Infinity) - (b.distance || Infinity)
  );
  
  // Handle load more calculated locations
  const handleLoadMoreCalculated = async () => {
    if (!onLoadMoreCalculated || !canLoadMoreCalculated) return;
    
    try {
      setLoadingMoreCalculated(true);
      await onLoadMoreCalculated();
      
      // Show different messages based on how many clicks remain
      const remainingClicks = maxLoadMoreClicks - (loadMoreClickCount + 1);
      if (remainingClicks === 1) {
        toast.info(
          language === 'en' 
            ? "Added more locations. You can request more locations one more time." 
            : "已添加更多位置。您还可以再请求一次更多位置。"
        );
      } else if (remainingClicks === 0) {
        toast.info(
          language === 'en' 
            ? "Added more locations. This was the final batch to prevent overloading."
            : "已添加更多位置。这是最后一批，以防止过载。"
        );
      }
    } catch (error) {
      console.error("Error loading more calculated locations:", error);
      toast.error(
        language === 'en' 
          ? "Failed to load more locations" 
          : "加载更多位置失败"
      );
    } finally {
      setLoadingMoreCalculated(false);
    }
  };
  
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
  
  if (loading) {
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
      
      {/* Load More Calculated Locations Button - New */}
      {onLoadMoreCalculated && canLoadMoreCalculated && (
        <div className="flex justify-center mt-8">
          <Button 
            variant="default" 
            onClick={handleLoadMoreCalculated}
            disabled={loadingMoreCalculated}
            className="group sci-fi-btn bg-cosmic-700/80 hover:bg-cosmic-600/90 hover:opacity-90 transition-all duration-300"
          >
            {loadingMoreCalculated ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
            )}
            {t("Load More Locations (AI Generated)", "加载更多位置（AI生成）")}
            {loadMoreClickCount > 0 && (
              <span className="ml-2 text-xs opacity-80">
                {t(
                  `(${maxLoadMoreClicks - loadMoreClickCount}/${maxLoadMoreClicks} left)`,
                  `（剩余${maxLoadMoreClicks - loadMoreClickCount}/${maxLoadMoreClicks}）`
                )}
              </span>
            )}
          </Button>
        </div>
      )}
      
      {/* Show info about click limits if we're close to the max */}
      {onLoadMoreCalculated && canLoadMoreCalculated && loadMoreClickCount > 0 && (
        <div className="flex justify-center mt-2">
          <div className="flex items-center text-xs text-amber-400/80 gap-1.5">
            <AlertCircle className="h-3 w-3" />
            {t(
              "Limited to prevent system overload", 
              "限制以防止系统过载"
            )}
          </div>
        </div>
      )}
      
      {/* Original Load More Button */}
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

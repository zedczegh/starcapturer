
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from "@/contexts/LanguageContext";
import { Calculator, Loader2, Target, RefreshCw, Search } from "lucide-react";
import PhotoLocationCard from '@/components/photoPoints/PhotoLocationCard';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { Button } from "@/components/ui/button";
import { batchCalculateSiqs } from '@/services/realTimeSiqsService';
import { toast } from 'sonner';

interface CalculatedLocationsProps {
  locations: SharedAstroSpot[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh?: () => void;
  searchRadius?: number;
}

const CalculatedLocations: React.FC<CalculatedLocationsProps> = ({ 
  locations, 
  loading, 
  hasMore, 
  onLoadMore,
  onRefresh,
  searchRadius = 0
}) => {
  const { t } = useLanguage();
  const [calculatingSiqs, setCalculatingSiqs] = useState(false);
  const [locationsWithSiqs, setLocationsWithSiqs] = useState<SharedAstroSpot[]>([]);
  const [hasApiError, setHasApiError] = useState(false);
  
  // Calculate SIQS for locations
  useEffect(() => {
    const calculateSiqs = async () => {
      if (locations.length === 0) {
        setLocationsWithSiqs([]);
        return;
      }
      
      if (loading) return;
      
      setCalculatingSiqs(true);
      setHasApiError(false);
      
      try {
        // If we already have locations with SIQS, don't recalculate unless forcing refresh
        if (locationsWithSiqs.length > 0 && locations.length === locationsWithSiqs.length) {
          setCalculatingSiqs(false);
          return;
        }
        
        // Calculate SIQS for all locations
        const updatedLocations = await batchCalculateSiqs(locations);
        
        // If no locations returned, show error message for API issues
        if (updatedLocations.length === 0 && locations.length > 0) {
          setHasApiError(true);
          
          // Fall back to using locations with estimated SIQS values
          const fallbackLocations = locations.map(loc => ({
            ...loc,
            siqs: Math.max(0, 10 - (loc.bortleScale || 5)),
            isViable: true
          }));
          
          // Sort by Bortle scale (lower is better) and then by distance
          fallbackLocations.sort((a, b) => {
            // First compare by bortle scale (lower is better)
            const bortleDiff = (a.bortleScale || 5) - (b.bortleScale || 5);
            if (bortleDiff !== 0) return bortleDiff;
            
            // If bortle scale is the same, compare by distance
            return (a.distance || Infinity) - (b.distance || Infinity);
          });
          
          setLocationsWithSiqs(fallbackLocations);
          
          toast.error(t(
            "Weather API limit reached. Using estimated values.",
            "天气API达到限制。使用估算值。"
          ));
        } else {
          // Sort by SIQS (highest first) and then by distance (closest first)
          updatedLocations.sort((a, b) => {
            // First compare by SIQS
            const siqsDiff = (b.siqs || 0) - (a.siqs || 0);
            if (siqsDiff !== 0) return siqsDiff;
            
            // If SIQS is the same, compare by distance
            return (a.distance || Infinity) - (b.distance || Infinity);
          });
          
          setLocationsWithSiqs(updatedLocations);
        }
      } catch (error) {
        console.error("Error calculating SIQS for locations:", error);
        setHasApiError(true);
        
        // Fall back to using raw locations with estimated SIQS values
        const fallbackLocations = locations.map(loc => ({
          ...loc,
          siqs: Math.max(0, 10 - (loc.bortleScale || 5)),
          isViable: true
        }));
        
        setLocationsWithSiqs(fallbackLocations);
      } finally {
        setCalculatingSiqs(false);
      }
    };
    
    calculateSiqs();
  }, [locations, loading, t]);
  
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
        staggerChildren: 0.1,
        when: "beforeChildren" 
      } 
    }
  };
  
  if (loading || calculatingSiqs) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }
  
  if (locationsWithSiqs.length === 0) {
    return (
      <div className="text-center py-12 glassmorphism rounded-xl bg-cosmic-800/30 border border-cosmic-600/30">
        <Calculator className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {t("No Viable Locations Found", "未找到可行的观测点")}
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
      {hasApiError && (
        <div className="mb-4 p-2 rounded-md bg-amber-900/20 border border-amber-500/30 text-amber-300 text-sm text-center">
          <p>{t("Using estimated SIQS values due to weather API limitations.", "由于天气API限制，使用估算的SIQS值。")}</p>
        </div>
      )}
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {locationsWithSiqs.map((location, index) => (
          <PhotoLocationCard
            key={location.id || `calc-loc-${index}`}
            location={location}
            index={index}
            showRealTimeSiqs={!hasApiError}
          />
        ))}
      </motion.div>
      
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

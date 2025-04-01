
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from "@/contexts/LanguageContext";
import { RefreshCcw, Ruler, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PhotoLocationCard from '@/components/photoPoints/PhotoLocationCard';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface CalculatedLocationsProps {
  locations: SharedAstroSpot[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  searchRadius: number; 
}

const CalculatedLocations: React.FC<CalculatedLocationsProps> = ({ 
  locations, 
  loading, 
  hasMore,
  onLoadMore,
  onRefresh,
  searchRadius
}) => {
  const { t } = useLanguage();
  
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
  
  // No data state
  if (!loading && locations.length === 0) {
    return (
      <div className="text-center py-12 glassmorphism rounded-xl bg-cosmic-800/30 border border-cosmic-600/30">
        <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {t("No Calculated Locations Found", "未找到计算位置")}
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto mb-4 text-sm">
          {t(
            "There are no algorithmically calculated astrophotography locations within your current search radius.",
            "在您当前的搜索半径内没有算法计算的天文摄影位置。"
          )}
        </p>
        
        <div className="flex items-center justify-center gap-2 mt-4">
          <Ruler className="h-4 w-4 text-primary" />
          <p className="text-sm text-primary">
            {t(
              "Try increasing your search radius to find more locations.",
              "尝试增加搜索半径以找到更多位置。"
            )}
          </p>
        </div>
        
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={onRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            {t("Refresh Data", "刷新数据")}
          </Button>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (loading && locations.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Locations grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {locations.map((location, index) => (
          <PhotoLocationCard
            key={location.id}
            location={location}
            index={index}
          />
        ))}
      </motion.div>
      
      {/* Load more button */}
      {hasMore && !loading && (
        <div className="flex justify-center mt-8">
          <Button 
            onClick={onLoadMore}
            variant="outline"
            className="gap-2"
          >
            {t("Load More Locations", "加载更多位置")}
          </Button>
        </div>
      )}
      
      {/* Loading state when fetching more */}
      {loading && locations.length > 0 && (
        <div className="flex justify-center mt-8">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      )}
      
      {/* Refresh button */}
      {!loading && locations.length > 0 && (
        <div className="flex justify-center mt-4">
          <Button
            variant="ghost"
            onClick={onRefresh}
            className="text-sm text-muted-foreground flex items-center gap-2"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            {t("Refresh SIQS Data", "刷新SIQS数据")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CalculatedLocations;

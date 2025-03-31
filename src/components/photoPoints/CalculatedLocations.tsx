
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from "@/contexts/LanguageContext";
import { Calculator, Loader2, Target } from "lucide-react";
import PhotoLocationCard from '@/components/photoPoints/PhotoLocationCard';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { Button } from "@/components/ui/button";

interface CalculatedLocationsProps {
  locations: SharedAstroSpot[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const CalculatedLocations: React.FC<CalculatedLocationsProps> = ({ 
  locations, 
  loading, 
  hasMore, 
  onLoadMore 
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
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }
  
  if (locations.length === 0) {
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
            {t(
              "Try adjusting your search radius to find better viewing spots.",
              "尝试调整搜索半径以找到更好的观测地点。"
            )}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <>
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
    </>
  );
};

export default CalculatedLocations;

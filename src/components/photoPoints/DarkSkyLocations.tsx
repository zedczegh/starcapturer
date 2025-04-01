
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from "@/contexts/LanguageContext";
import { Award, Globe, Loader2, RefreshCw } from "lucide-react";
import PhotoLocationCard from '@/components/photoPoints/PhotoLocationCard';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { Button } from "@/components/ui/button";
import { batchCalculateSiqs } from '@/services/realTimeSiqsService';

interface DarkSkyLocationsProps {
  locations: SharedAstroSpot[];
  loading: boolean;
  onRefresh?: () => void;
}

const DarkSkyLocations: React.FC<DarkSkyLocationsProps> = ({ 
  locations, 
  loading,
  onRefresh 
}) => {
  const { t } = useLanguage();
  const [locationsWithSiqs, setLocationsWithSiqs] = useState<SharedAstroSpot[]>([]);
  const [calculatingSiqs, setCalculatingSiqs] = useState(false);
  
  // Calculate SIQS for certified locations
  useEffect(() => {
    const calculateSiqs = async () => {
      if (locations.length === 0 || loading) return;
      
      setCalculatingSiqs(true);
      try {
        // Calculate SIQS for all certified locations
        const updatedLocations = await batchCalculateSiqs(locations);
        
        // Filter out locations with SIQS = 0 (already done in batchCalculateSiqs)
        
        // Sort by SIQS (highest first) and then by distance (closest first)
        updatedLocations.sort((a, b) => {
          // First compare by SIQS
          const siqsDiff = (b.siqs || 0) - (a.siqs || 0);
          if (siqsDiff !== 0) return siqsDiff;
          
          // If SIQS is the same, compare by distance
          return (a.distance || Infinity) - (b.distance || Infinity);
        });
        
        setLocationsWithSiqs(updatedLocations);
      } catch (error) {
        console.error("Error calculating SIQS for certified locations:", error);
      } finally {
        setCalculatingSiqs(false);
      }
    };
    
    calculateSiqs();
  }, [locations, loading]);
  
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
        <Award className="h-12 w-12 text-blue-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {t("No Viable Certified Locations Nearby", "附近没有可行的认证暗夜地点")}
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto mb-2 text-sm">
          {t(
            "There are no certified dark sky locations with good viewing conditions within your search radius.",
            "在您当前的搜索半径内没有具备良好观测条件的认证暗夜地点。"
          )}
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Globe className="h-4 w-4 text-primary" />
          <p className="text-sm text-primary">
            {t(
              "Try increasing your search radius or wait for better weather conditions.",
              "尝试增加搜索半径或等待更好的天气条件。"
            )}
          </p>
        </div>
        
        {onRefresh && (
          <div className="mt-6">
            <Button 
              variant="outline" 
              onClick={onRefresh}
              className="group border-primary/40 hover:bg-cosmic-800/50"
            >
              <RefreshCw className="mr-2 h-4 w-4 group-hover:animate-spin" />
              {t("Refresh Locations", "刷新位置")}
            </Button>
          </div>
        )}
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
        {locationsWithSiqs.map((location, index) => (
          <PhotoLocationCard
            key={location.id}
            location={location}
            index={index}
            showRealTimeSiqs={true}
          />
        ))}
      </motion.div>
      
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

export default DarkSkyLocations;


import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from "@/contexts/LanguageContext";
import { Award, Loader2 } from "lucide-react";
import PhotoLocationCard from '@/components/photoPoints/PhotoLocationCard';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useIsMobile } from '@/hooks/use-mobile';
import { batchCalculateSiqs } from '@/services/realTimeSiqsService';
import { toast } from 'sonner';

interface DarkSkyLocationsProps {
  locations: SharedAstroSpot[];
  loading: boolean;
  initialLoad?: boolean;
}

const DarkSkyLocations: React.FC<DarkSkyLocationsProps> = ({ 
  locations, 
  loading,
  initialLoad = false
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [enhancedLocations, setEnhancedLocations] = React.useState<SharedAstroSpot[]>([]);
  const [enhancingLocations, setEnhancingLocations] = React.useState(false);
  
  const sortedLocations = React.useMemo(() => {
    return [...(enhancedLocations.length > 0 ? enhancedLocations : locations)]
      .sort((a, b) => {
        const getWeight = (loc: SharedAstroSpot) => {
          const cert = (loc.certification || '').toLowerCase();
          if (cert.includes('reserve') || cert.includes('sanctuary')) return 4;
          if (cert.includes('park')) return 3;
          if (cert.includes('community')) return 2;
          if (cert.includes('urban')) return 1;
          return 0;
        };
        
        const weightA = getWeight(a);
        const weightB = getWeight(b);
        
        if (weightA !== weightB) return weightB - weightA;
        
        if (a.siqs !== undefined && b.siqs !== undefined) {
          return b.siqs - a.siqs;
        }
        
        return (a.bortleScale || 5) - (b.bortleScale || 5);
      });
  }, [locations, enhancedLocations]);
  
  useEffect(() => {
    if (locations.length > 0 && !enhancingLocations && enhancedLocations.length === 0) {
      const calculateRealTimeSiqs = async () => {
        setEnhancingLocations(true);
        try {
          console.log(`Calculating real-time SIQS for ${locations.length} certified locations`);
          const updated = await batchCalculateSiqs(locations, 3);
          setEnhancedLocations(updated);
        } catch (error) {
          console.error("Error calculating real-time SIQS for certified locations:", error);
          setEnhancedLocations(locations);
        } finally {
          setEnhancingLocations(false);
        }
      };
      
      calculateRealTimeSiqs();
    }
  }, [locations, enhancingLocations, enhancedLocations.length]);
  
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
        <Award className="h-12 w-12 text-blue-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {t("No Certified Dark Sky Locations", "没有认证的暗夜地点")}
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto mb-2 text-sm">
          {t(
            "We couldn't find any certified Dark Sky locations within your search radius.",
            "在您的搜索半径内，我们未能找到任何认证的暗夜地点。"
          )}
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <p className="text-sm text-muted-foreground">
            {t(
              "Try the 'Calculated' tab to find locations with good viewing conditions.",
              "尝试"计算"选项卡，寻找具有良好观测条件的地点。"
            )}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      variants={containerVariants}
      initial={initialLoad ? "hidden" : "visible"}
      animate="visible"
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${isMobile ? 'content-visibility-auto' : ''}`}
    >
      {sortedLocations.map((location, index) => (
        <PhotoLocationCard
          key={location.id || `cert-loc-${index}`}
          location={location}
          index={index}
          showRealTimeSiqs={true}
          isMobile={isMobile}
        />
      ))}
      
      {enhancingLocations && (
        <div className="col-span-full flex justify-center items-center py-4">
          <p className="text-sm text-muted-foreground animate-pulse flex items-center">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t("Enhancing location data...", "正在增强位置数据...")}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default DarkSkyLocations;

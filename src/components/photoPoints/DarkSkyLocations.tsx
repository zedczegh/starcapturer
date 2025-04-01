
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from "@/contexts/LanguageContext";
import { Award, Globe, Loader2 } from "lucide-react";
import PhotoLocationCard from '@/components/photoPoints/PhotoLocationCard';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface DarkSkyLocationsProps {
  locations: SharedAstroSpot[];
  loading: boolean;
}

const DarkSkyLocations: React.FC<DarkSkyLocationsProps> = ({ locations, loading }) => {
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
        <Award className="h-12 w-12 text-blue-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {t("No Certified Locations Nearby", "附近没有认证的暗夜地点")}
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto mb-2 text-sm">
          {t(
            "There are no certified dark sky locations within your current search radius.",
            "在您当前的搜索半径内没有认证的暗夜地点。"
          )}
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Globe className="h-4 w-4 text-primary" />
          <p className="text-sm text-primary">
            {t(
              "Try increasing your search radius to find certified locations.",
              "尝试增加搜索半径以找到认证地点。"
            )}
          </p>
        </div>
      </div>
    );
  }
  
  return (
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
  );
};

export default DarkSkyLocations;

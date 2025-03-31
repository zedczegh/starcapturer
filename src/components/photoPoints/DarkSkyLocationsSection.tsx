
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Loader2, Globe, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDarkSkyLocations } from '@/hooks/useDarkSkyLocations';
import PhotoLocationCard from './PhotoLocationCard';
import DarkSkyBadges from './DarkSkyBadges';
import { Button } from '@/components/ui/button';

interface DarkSkyLocationsSectionProps {
  coordinates: { latitude: number; longitude: number } | null;
}

const DarkSkyLocationsSection: React.FC<DarkSkyLocationsSectionProps> = ({ coordinates }) => {
  const { t } = useLanguage();
  const { darkSkyLocations, isDarkSkyLoading } = useDarkSkyLocations(coordinates);
  const [showAll, setShowAll] = useState(false);
  
  if (!coordinates) return null;
  
  if (isDarkSkyLoading) {
    return (
      <div className="py-8 text-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">
          {t("Loading dark sky locations...", "正在加载暗夜区域...")}
        </p>
      </div>
    );
  }
  
  if (darkSkyLocations.length === 0) {
    return null;
  }

  // Control how many locations to display based on showAll state
  const displayLocations = showAll ? darkSkyLocations : darkSkyLocations.slice(0, 6);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-900/30 p-2 rounded-lg">
            <Award className="h-6 w-6 text-blue-400" fill="rgba(96, 165, 250, 0.2)" />
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {t("Dark Sky Certified Locations", "暗夜认证地点")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("IDA certified places with exceptional stargazing conditions", "IDA认证的拥有极佳观星条件的地点")}
            </p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2 bg-cosmic-800/60 border border-cosmic-700/30 px-3 py-1.5 rounded-full">
          <Globe className="h-4 w-4 text-blue-400" />
          <span className="text-xs text-blue-200">
            {t("Showing worldwide locations", "显示全球位置")}
          </span>
        </div>
      </div>
      
      <div className="mb-6 glassmorphism p-4 rounded-xl bg-blue-950/20 border border-blue-900/20">
        <DarkSkyBadges />
      </div>
      
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1,
            transition: { 
              staggerChildren: 0.1,
              when: "beforeChildren" 
            } 
          }
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {displayLocations.map((location, index) => (
          <PhotoLocationCard
            key={location.id}
            location={location}
            index={index}
          />
        ))}
      </motion.div>
      
      {darkSkyLocations.length > 6 && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="group border-blue-600/30 hover:border-blue-500/50 hover:bg-blue-900/20"
          >
            {showAll ? (
              <>
                {t("Show Less", "显示更少")}
                <MapPin className="ml-2 h-4 w-4 transition-transform group-hover:-translate-y-1" />
              </>
            ) : (
              <>
                {t("Show All Dark Sky Locations", "显示所有暗夜区域")}
                <MapPin className="ml-2 h-4 w-4 transition-transform group-hover:translate-y-1" />
              </>
            )}
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default DarkSkyLocationsSection;

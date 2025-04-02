
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from "@/contexts/LanguageContext";
import { Award, Globe, Trees, Building2, Loader2 } from "lucide-react";
import PhotoLocationCard from '@/components/photoPoints/PhotoLocationCard';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useIsMobile } from '@/hooks/use-mobile';

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

  // Group locations by certification type
  const groupedLocations = React.useMemo(() => {
    const groups: Record<string, SharedAstroSpot[]> = {
      reserves: [],
      parks: [],
      communities: [],
      urban: [],
      other: []
    };

    locations.forEach(location => {
      const cert = (location.certification || '').toLowerCase();
      
      if (cert.includes('sanctuary') || cert.includes('reserve')) {
        groups.reserves.push(location);
      } else if (cert.includes('park')) {
        groups.parks.push(location);
      } else if (cert.includes('community')) {
        groups.communities.push(location);
      } else if (cert.includes('urban')) {
        groups.urban.push(location);
      } else {
        groups.other.push(location);
      }
    });

    return groups;
  }, [locations]);
  
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

  // Function to render a section of locations
  const renderLocationSection = (
    locations: SharedAstroSpot[], 
    title: string, 
    icon: React.ReactNode, 
    description: string
  ) => {
    if (locations.length === 0) return null;
    
    return (
      <div className="mb-8 last:mb-0">
        <div className="flex items-center mb-3 gap-2">
          {icon}
          <h3 className="text-lg font-medium">{title}</h3>
          <span className="text-sm text-muted-foreground ml-2">({locations.length})</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <motion.div
          variants={containerVariants}
          initial={initialLoad ? "hidden" : "visible"}
          animate="visible"
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${isMobile ? 'content-visibility-auto' : ''}`}
        >
          {locations.map((location, index) => (
            <PhotoLocationCard
              key={location.id}
              location={location}
              index={index}
              isMobile={isMobile}
            />
          ))}
        </motion.div>
      </div>
    );
  };
  
  return (
    <div>
      {renderLocationSection(
        groupedLocations.reserves,
        t("Dark Sky Reserves & Sanctuaries", "暗夜保护区和保护地"),
        <Globe className="h-5 w-5 text-blue-400" />,
        t(
          "These are outstanding dark sky areas with exceptional starry nights, protected for scientific, natural, educational, or cultural heritage.",
          "这些地区拥有卓越的暗夜天空和壮观的星空，受到保护以维护其科学、自然、教育或文化遗产价值。"
        )
      )}
      
      {renderLocationSection(
        groupedLocations.parks,
        t("Dark Sky Parks", "暗夜公园"),
        <Trees className="h-5 w-5 text-green-400" />,
        t(
          "Public or private land with exceptional starry skies and natural nocturnal habitat where light pollution is mitigated.",
          "具有卓越星空和自然夜间栖息地的公共或私人土地，在这里光污染得到缓解。"
        )
      )}
      
      {renderLocationSection(
        groupedLocations.communities,
        t("Dark Sky Communities", "暗夜社区"),
        <Building2 className="h-5 w-5 text-amber-400" />,
        t(
          "Towns, cities, and municipalities that adopt quality outdoor lighting to preserve dark skies for their residents and visitors.",
          "采用高质量户外照明以为居民和游客保护暗夜天空的城镇、城市和社区。"
        )
      )}
      
      {renderLocationSection(
        groupedLocations.urban,
        t("Urban Night Sky Places", "城市夜空地点"),
        <Building2 className="h-5 w-5 text-purple-400" />,
        t(
          "Urban locations that demonstrate exceptional dedication to the preservation of the night sky through lighting and education.",
          "通过照明和教育展示对夜空保护的卓越奉献的城市地点。"
        )
      )}
      
      {renderLocationSection(
        groupedLocations.other,
        t("Other Certified Locations", "其他认证地点"),
        <Award className="h-5 w-5 text-blue-300" />,
        t(
          "These are dark sky locations with various certifications for quality night skies.",
          "这些是拥有各种夜空质量认证的暗夜地点。"
        )
      )}
    </div>
  );
};

export default DarkSkyLocations;

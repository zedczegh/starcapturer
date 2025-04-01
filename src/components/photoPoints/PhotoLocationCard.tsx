
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Ruler, Award, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { siqsToColor } from '@/lib/calculateSIQS';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { formatDistanceToNow } from 'date-fns';
import { formatLocationName, getRegionalName } from '@/utils/locationNameFormatter';

interface PhotoLocationCardProps {
  location: SharedAstroSpot;
  index: number;
}

const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({ location, index }) => {
  const { t, language } = useLanguage();
  
  // Animation variants for staggered list animation
  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.05,
        duration: 0.5,
        ease: [0.48, 0.15, 0.25, 0.96]
      }
    }
  };
  
  const scoreColor = location.siqs 
    ? siqsToColor(location.siqs, location.isViable ?? (location.siqs >= 6.5)) 
    : '#4a5568';
  
  // Format the relative time
  const relativeTime = location.timestamp
    ? formatDistanceToNow(new Date(location.timestamp), { addSuffix: true })
    : '';
  
  // Format the distance if available
  const formattedDistance = location.distance 
    ? location.distance < 1 
      ? `${(location.distance * 1000).toFixed(0)} m`
      : `${location.distance.toFixed(1)} km`
    : '';
    
  // Format location name, using regional naming for remote locations
  let displayName = formatLocationName(location.name, language as any);
  
  // Use regional naming for remote areas or coordinates
  if (
    displayName === "Remote area" || 
    displayName === "偏远地区" || 
    displayName.includes("°") || 
    displayName.includes("Location at") || 
    displayName.includes("位置在")
  ) {
    // Try regional naming like "Northwest Yunnan"
    const regionalName = getRegionalName(location.latitude, location.longitude, language as any);
    if (regionalName !== (language === 'en' ? 'Remote area' : '偏远地区')) {
      displayName = regionalName;
    }
  }

  // Use Chinese name if available and language is Chinese
  if (language === 'zh' && location.chineseName) {
    displayName = location.chineseName;
  }
  
  return (
    <motion.div variants={item} initial="hidden" animate="visible">
      <Link to={`/location/${location.id}`} state={{ ...location }}>
        <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          {/* Dark blue background with gradient */}
          <div 
            className="h-24 relative flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(16,18,64,1) 0%, rgba(36,42,107,1) 100%)"
            }}
          >
            {/* Add stars background */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: "url('/images/stars.png')",
                backgroundSize: "cover"
              }}
            />
            
            {/* SIQS score display with color-coded rings */}
            <div className="relative z-10 flex items-center justify-center">
              <div 
                className="rounded-full p-3 flex items-center justify-center" 
                style={{ backgroundColor: scoreColor, opacity: 0.2 }}
              >
                <div 
                  className="rounded-full p-6 flex items-center justify-center"
                  style={{ backgroundColor: scoreColor, opacity: 0.4 }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold">
                  {location.siqs ? location.siqs.toFixed(1) : '?'}
                </span>
              </div>
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-lg line-clamp-1">{displayName}</h3>
                
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  <span>
                    {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}
                  </span>
                </div>
              </div>
              
              {/* Show certification badge for dark sky reserves */}
              {(location.isDarkSkyReserve || location.certification) && (
                <Badge className="bg-blue-500 hover:bg-blue-600 whitespace-nowrap">
                  <Award className="h-3 w-3 mr-1" />
                  {t("Certified", "已认证")}
                </Badge>
              )}
              
              {/* Viable badge */}
              {location.isViable !== undefined && (
                <Badge 
                  variant={location.isViable ? "default" : "destructive"}
                  className="whitespace-nowrap"
                >
                  {location.isViable ? (
                    <span className="flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      {t("Viable", "可行")}
                    </span>
                  ) : (
                    t("Not Viable", "不可行")
                  )}
                </Badge>
              )}
            </div>
            
            {/* Only show certification name if it exists */}
            {location.certification && (
              <div className="mt-2">
                <Badge variant="outline" className="bg-blue-950/30 text-xs">
                  {location.certification}
                </Badge>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between items-center">
            <div className="flex items-center">
              {relativeTime}
            </div>
            
            {formattedDistance && (
              <div className="flex items-center">
                <Ruler className="h-3.5 w-3.5 mr-1.5" />
                {formattedDistance}
              </div>
            )}
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
};

export default PhotoLocationCard;

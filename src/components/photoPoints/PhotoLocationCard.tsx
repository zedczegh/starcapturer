
import React from 'react';
import { motion } from 'framer-motion';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatSIQSScore } from '@/utils/geoUtils';
import { formatLocationName } from '@/utils/locationNameFormatter';
import { formatDate } from '@/utils/dateUtils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, MapPin, Calendar, Moon, Globe, TreePine, Building, Star } from 'lucide-react';

interface PhotoLocationCardProps {
  location: SharedAstroSpot;
  index: number;
}

const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({ location, index }) => {
  const { t, language } = useLanguage();
  
  // Item animation for staggered effect
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };
  
  const displayName = formatLocationName(location.name, language);
  
  // Format date if available
  const formattedDate = location.timestamp 
    ? formatDate(new Date(location.timestamp), language === 'zh')
    : '';
    
  // Determine certification icon based on certification type
  const getCertificationIcon = () => {
    if (!location.certification) return <Award className="h-4 w-4 mr-2" />;
    
    const certLower = location.certification.toLowerCase();
    
    if (certLower.includes('sanctuary')) {
      return <Moon className="h-4 w-4 mr-2" fill="rgba(96, 165, 250, 0.2)" />;
    } else if (certLower.includes('reserve') || location.isDarkSkyReserve) {
      return <Globe className="h-4 w-4 mr-2" fill="rgba(96, 165, 250, 0.2)" />;
    } else if (certLower.includes('park')) {
      return <TreePine className="h-4 w-4 mr-2" fill="rgba(96, 165, 250, 0.2)" />;
    } else if (certLower.includes('community')) {
      return <Building className="h-4 w-4 mr-2" fill="rgba(96, 165, 250, 0.2)" />;
    } else {
      return <Award className="h-4 w-4 mr-2" fill="rgba(96, 165, 250, 0.2)" />;
    }
  };
  
  // Function to format distance in a user-friendly way
  const formatDistance = (distance?: number) => {
    if (!distance) return t("Unknown distance", "未知距离");
    
    if (distance < 1) {
      return t(`${Math.round(distance * 1000)}m away`, `${Math.round(distance * 1000)}米外`);
    } else if (distance < 100) {
      return t(`${Math.round(distance)}km away`, `${Math.round(distance)}公里外`);
    } else {
      return t(`${Math.round(distance / 10) * 10}km away`, `${Math.round(distance / 10) * 10}公里外`);
    }
  };
  
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.1 }}
    >
      <Card className="h-full overflow-hidden transition-all hover:shadow-lg border-cosmic-700 bg-cosmic-900/60 backdrop-blur-sm hover:bg-cosmic-900/80">
        <div className="relative">
          <div 
            className="h-32 bg-cosmic-800 flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(16,18,64,0.8) 0%, rgba(36,42,107,0.8) 100%)"
            }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: "url('/images/stars.png')",
                backgroundSize: "cover",
              }}
            />
            
            {/* SIQS Score Circle */}
            <div className="relative z-10 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold">{formatSIQSScore(location.siqs)}</div>
                <div className="text-xs text-blue-200 mt-1">{t("SIQS Score", "SIQS 分数")}</div>
              </div>
            </div>
            
            {/* Certification Badge */}
            {location.certification && (
              <Badge className="absolute top-3 left-3 bg-blue-600/80 hover:bg-blue-600/80">
                <Star className="h-3 w-3 mr-1" fill="#facc15" stroke="none" />
                {t("Certified", "认证")}
              </Badge>
            )}
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-2 mb-3">
            {displayName}
          </h3>
          
          {/* Certification Type */}
          {location.certification && (
            <div className="flex items-center text-blue-400 mb-3 text-sm">
              {getCertificationIcon()}
              <span className="line-clamp-2">{location.certification}</span>
            </div>
          )}
          
          <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 opacity-70" />
              <span>{formatDistance(location.distance)}</span>
            </div>
            
            {formattedDate && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 opacity-70" />
                <span>{formattedDate}</span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex justify-between">
          <div className="flex items-center">
            <Badge variant="outline" className="text-xs">
              {location.bortleScale 
                ? t(`Bortle ${location.bortleScale}`, `波特尔 ${location.bortleScale}`) 
                : t("Unknown Bortle", "未知波特尔")}
            </Badge>
          </div>
          
          <Button
            size="sm"
            variant="secondary"
            className="text-xs px-3 py-1 h-7"
          >
            {t("View Details", "查看详情")}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PhotoLocationCard;

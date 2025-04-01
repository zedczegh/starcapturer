
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { siqsToColor } from "@/lib/calculateSIQS";
import { formatLocationName } from "@/utils/locationNameFormatter";
import { formatDistance } from "@/utils/unitConversion";
import { CalendarClock, MapPin, Award, Building, Globe, Moon } from "lucide-react";
import { getRelativeTimeText } from "@/utils/dateUtils";

export interface PhotoLocationCardProps {
  location: any;
  index: number;
}

const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({
  location,
  index
}) => {
  const { t, language } = useLanguage();
  
  const scoreColor = siqsToColor(location.siqs || 0, location.isViable || false);
  const displayName = formatLocationName(location.name, language);
  const distance = formatDistance(location.distance || 0, language);
  const relativeTime = getRelativeTimeText(location.timestamp, language === 'zh');
  
  // Get certification icon
  const getCertificationIcon = () => {
    if (!location.certification) return null;
    
    const certLower = location.certification.toLowerCase();
    
    if (certLower.includes('sanctuary')) {
      return <Moon className="h-3.5 w-3.5 text-blue-400" fill="rgba(96, 165, 250, 0.3)" />;
    } else if (certLower.includes('reserve') || location.isDarkSkyReserve) {
      return <Globe className="h-3.5 w-3.5 text-blue-400" fill="rgba(96, 165, 250, 0.3)" />;
    } else if (certLower.includes('park')) {
      return <Award className="h-3.5 w-3.5 text-blue-400" fill="rgba(96, 165, 250, 0.3)" />;
    } else if (certLower.includes('community')) {
      return <Building className="h-3.5 w-3.5 text-blue-400" fill="rgba(96, 165, 250, 0.3)" />;
    } else {
      return <Award className="h-3.5 w-3.5 text-blue-400" fill="rgba(96, 165, 250, 0.3)" />;
    }
  };
  
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            delay: index * 0.05,
            duration: 0.3,
            type: "spring",
            stiffness: 150
          }
        }
      }}
      className="w-full"
    >
      <Link to={`/location/${location.id}`} state={location}>
        <Card className="h-full overflow-hidden transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg">
          <div 
            className="h-24 bg-cosmic-800 flex items-center justify-center relative"
            style={{
              background: "linear-gradient(135deg, rgba(16,18,64,1) 0%, rgba(36,42,107,1) 100%)"
            }}
          >
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: "url('/images/stars.png')",
                backgroundSize: "cover"
              }}
            />
            <div className="relative z-10 flex items-center justify-center">
              <div 
                className="rounded-full p-3 flex items-center justify-center"
                style={{
                  backgroundColor: scoreColor,
                  opacity: 0.2
                }}
              >
                <div 
                  className="rounded-full p-6 flex items-center justify-center"
                  style={{
                    backgroundColor: scoreColor,
                    opacity: 0.4
                  }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold">{(location.siqs || 0).toFixed(1)}</span>
              </div>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg line-clamp-1">{displayName}</h3>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  <span>{distance}</span>
                </div>
              </div>
              <Badge 
                className="ml-2" 
                variant={location.isViable ? "default" : "destructive"}
              >
                {location.isViable ? t("Viable", "可行") : t("Not Viable", "不可行")}
              </Badge>
            </div>
            
            {location.certification && (
              <div className="mt-2 flex items-center">
                {getCertificationIcon()}
                <span className="text-xs text-blue-400 ml-1 line-clamp-1">{location.certification}</span>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
                <span>{relativeTime}</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
};

export default PhotoLocationCard;

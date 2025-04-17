
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Camera, Map, Award, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { getLocationNameForCoordinates } from "@/services/geocoding/geocodingService";
import { calculateAstronomicalNight, formatTime } from "@/utils/astronomy/nightTimeCalculator";
import SiqsScoreBadge from "../photoPoints/cards/SiqsScoreBadge";

interface PhotoPointsSectionProps {
  currentSiqs?: number | null;
}

const PhotoPointsSection: React.FC<PhotoPointsSectionProps> = ({ currentSiqs }) => {
  const { t, language } = useLanguage();
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{latitude: number, longitude: number} | null>(null);
  const [nightTime, setNightTime] = useState<string | null>(null);
  
  // Get location data from store if available
  useEffect(() => {
    try {
      const savedLocationString = localStorage.getItem('latest_siqs_location');
      
      if (savedLocationString) {
        const savedLocation = JSON.parse(savedLocationString);
        
        if (savedLocation && savedLocation.latitude && savedLocation.longitude) {
          setLocationCoords({
            latitude: savedLocation.latitude,
            longitude: savedLocation.longitude
          });
          
          if (savedLocation.name) {
            setLocationName(savedLocation.name);
          } else {
            // Get location name from coordinates
            getLocationNameForCoordinates(
              savedLocation.latitude,
              savedLocation.longitude,
              language === 'zh' ? 'zh' : 'en'
            ).then(name => {
              if (name) setLocationName(name);
            }).catch(err => console.error("Error getting location name:", err));
          }
          
          // Calculate astronomical night for this location
          try {
            const { start, end } = calculateAstronomicalNight(
              savedLocation.latitude,
              savedLocation.longitude
            );
            
            setNightTime(`${formatTime(start)} - ${formatTime(end)}`);
          } catch (err) {
            console.error("Error calculating astronomical night:", err);
          }
        }
      }
    } catch (e) {
      console.error("Error loading location data:", e);
    }
  }, [language]);
  
  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.7, 
        ease: "easeOut" 
      } 
    }
  };
  
  return (
    <section className="py-16 bg-cosmic-800">
      <div className="container mx-auto px-4">
        <motion.div 
          className="flex flex-col items-center text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUpVariants}
        >
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-6">
            <Map className="h-3.5 w-3.5 text-primary mr-2" />
            <span className="text-xs font-medium text-primary">
              {t("Discover Photo Spots", "发现拍摄地点")}
            </span>
          </div>
          
          <h2 className="text-3xl font-bold mb-4">
            {t("Explore ", "探索")}
            <span className="text-gradient-blue">
              {t("Premium Locations", "优质位置")}
            </span>
          </h2>
          
          <p className="text-muted-foreground max-w-2xl">
            {t(
              "Find the perfect locations for astrophotography with optimal viewing conditions. Our algorithm identifies the best spots based on SIQS factors.",
              "寻找具有最佳观测条件的天文摄影理想地点。我们的算法根据SIQS因素识别最佳地点。"
            )}
          </p>
          
          <div className="mt-6 flex items-center justify-center gap-2 bg-cosmic-700/20 border border-cosmic-600/20 p-2 rounded-lg">
            <Award className="h-4 w-4 text-blue-400" />
            <p className="text-sm text-blue-200">
              {t(
                "Featuring official Dark Sky certified locations from around the world!",
                "收录来自世界各地的官方认证暗夜区域！"
              )}
            </p>
          </div>
        </motion.div>
        
        {currentSiqs !== null && currentSiqs >= 6 && locationCoords && (
          <motion.div 
            className="mb-8 max-w-md mx-auto text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col items-center mb-2">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-5 w-5 text-yellow-400 mr-2" fill="#facc15" />
                <p className="text-green-400 font-semibold">
                  {t("Great SIQS Score Detected!", "检测到优秀的SIQS评分！")}
                </p>
              </div>
              
              <div className="flex justify-center mb-2">
                <SiqsScoreBadge 
                  score={currentSiqs} 
                  latitude={locationCoords.latitude}
                  longitude={locationCoords.longitude}
                />
              </div>
              
              {locationName && (
                <p className="text-sm text-white/90 mb-1">
                  {locationName}
                </p>
              )}
              
              {nightTime && (
                <p className="text-xs text-white/70">
                  {t("Astronomical Night:", "天文夜晚:")} {nightTime}
                </p>
              )}
            </div>
            
            <p className="text-sm text-white/90">
              {t(
                "Your location has excellent astrophotography conditions!",
                "您的位置拥有优秀的天文摄影条件！"
              )}
            </p>
          </motion.div>
        )}
        
        <div className="flex justify-center">
          <Link to="/photo-points">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary/90 to-primary/70 hover:opacity-90 shadow-md hover:shadow-lg transition-all py-6 px-8 rounded-lg text-white flex items-center gap-2" 
            >
              <Camera className="h-5 w-5" />
              {t("View All Photo Points", "查看所有拍摄点")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PhotoPointsSection;


import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

interface LocationSectionProps {
  latitude: string;
  longitude: string;
  locationName: string;
  isLoadingLocation: boolean;
  setLatitude: (value: string) => void;
  setLongitude: (value: string) => void;
}

const LocationSection: React.FC<LocationSectionProps> = ({
  latitude,
  longitude,
  locationName,
  isLoadingLocation,
  setLatitude,
  setLongitude
}) => {
  const { t } = useLanguage();
  
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };
  
  return (
    <motion.div 
      className="glassmorphism border-cosmic-700/30 rounded-xl p-6 relative overflow-hidden"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.1 }}
    >
      <div className="absolute inset-0 z-0 opacity-20 bg-gradient-to-br from-cosmic-800/20 to-cosmic-900/20" />
      
      <div className="relative z-10">
        <h2 className="text-lg font-medium flex items-center gap-2 mb-4">
          <MapPin size={18} className="text-primary" />
          {t("Your Location", "您的位置")}
        </h2>
        
        {locationName && (
          <div className="text-sm text-cosmic-200 mb-4 bg-cosmic-800/40 p-3 rounded-lg border border-cosmic-700/30">
            {locationName}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="latitude" className="text-xs opacity-80 mb-1 block">{t("Latitude", "纬度")}</Label>
            <Input
              id="latitude"
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder={t("Latitude", "纬度")}
              disabled={isLoadingLocation}
              className="h-9 text-sm bg-cosmic-800/30 border-cosmic-700/50 focus-visible:ring-primary/50"
            />
          </div>
          <div>
            <Label htmlFor="longitude" className="text-xs opacity-80 mb-1 block">{t("Longitude", "经度")}</Label>
            <Input
              id="longitude"
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder={t("Longitude", "经度")}
              disabled={isLoadingLocation}
              className="h-9 text-sm bg-cosmic-800/30 border-cosmic-700/50 focus-visible:ring-primary/50"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LocationSection;


import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from "sonner";

interface PinpointButtonProps {
  onGetLocation: () => void;
  className?: string;
  shouldCenter?: boolean;
  hasLocation?: boolean;
}

const PinpointButton: React.FC<PinpointButtonProps> = ({ 
  onGetLocation,
  className = "absolute top-4 right-16 z-[999]", 
  shouldCenter = true,
  hasLocation = false
}) => {
  const { t } = useLanguage();
  const [isClicking, setIsClicking] = useState(false);
  
  const stopPropagation = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    stopPropagation(e);
    setIsClicking(true);
    
    // Call the location handler
    onGetLocation();
    
    // Try to center the map on user location
    if (shouldCenter) {
      try {
        const leafletMap = (window as any).leafletMap;
        if (leafletMap) {
          setTimeout(() => {
            leafletMap.setView(
              [leafletMap.getCenter().lat, leafletMap.getCenter().lng],
              12,
              { 
                animate: true,
                duration: 1 
              }
            );
          }, 300); // Small delay to allow location update
        }
      } catch (error) {
        console.error("Error centering map:", error);
        toast.error(t("Could not center map", "无法将地图居中"));
      }
    }
    
    setTimeout(() => setIsClicking(false), 1000);
  }, [onGetLocation, shouldCenter, t]);

  return (
    <div 
      className={className}
      onClick={stopPropagation} 
      onTouchStart={stopPropagation}
    >
      <motion.button
        initial={{ scale: 0.95, opacity: 0.8 }}
        animate={{ 
          scale: [0.95, 1.05, 0.95],
          opacity: [0.8, 1, 0.8],
        }}
        whileHover={{ 
          scale: 1.15, 
          transition: { 
            duration: 0.3,
            type: "spring", 
            stiffness: 300 
          } 
        }}
        whileTap={{ scale: 0.9 }}
        transition={{ 
          repeat: Infinity, 
          duration: 3,
          ease: "easeInOut"
        }}
        onClick={handleClick}
        className="flex items-center justify-center p-0.5 bg-gradient-to-br from-primary/70 via-accent/60 to-primary/70 rounded-full shadow-lg border border-primary/30 backdrop-blur-sm transition-all relative"
        style={{ boxShadow: '0 0 15px hsl(var(--primary) / 0.5)' }}
      >
        <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-accent/80">
          <MapPin className="h-5 w-5 text-white/90" strokeWidth={2.2} />
        </div>
        
        <motion.div 
          className="absolute inset-0 rounded-full"
          animate={{ 
            boxShadow: isClicking 
              ? [
                  '0 0 0 hsl(var(--primary) / 0)',
                  '0 0 20px hsl(var(--primary) / 0.8)',
                  '0 0 30px hsl(var(--primary) / 0.4)',
                  '0 0 0 hsl(var(--primary) / 0)'
                ] 
              : [
                  '0 0 0 hsl(var(--primary) / 0)',
                  '0 0 10px hsl(var(--primary) / 0.7)',
                  '0 0 20px hsl(var(--primary) / 0.4)',
                  '0 0 0 hsl(var(--primary) / 0)'
                ]
          }}
          transition={{ 
            duration: isClicking ? 1 : 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
      </motion.button>
    </div>
  );
};

export default PinpointButton;

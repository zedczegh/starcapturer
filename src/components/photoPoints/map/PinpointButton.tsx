
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface PinpointButtonProps {
  onGetLocation: () => void;
  className?: string;
  shouldCenter?: boolean;
}

const PinpointButton: React.FC<PinpointButtonProps> = ({ 
  onGetLocation,
  className = "absolute top-4 right-16 z-[999]", // Positioned at top-right corner to align with legend
  shouldCenter = true
}) => {
  const { t } = useLanguage();
  const [isClicking, setIsClicking] = useState(false);
  
  // Function to prevent event propagation
  const stopPropagation = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    stopPropagation(e);
    setIsClicking(true);
    
    onGetLocation();
    toast.success(t("Finding your location...", "正在定位您的位置..."));
    
    // Reset clicking state after animation completes
    setTimeout(() => setIsClicking(false), 1000);
  }, [onGetLocation, t]);

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
        className={`flex items-center justify-center p-0.5 bg-gradient-to-br from-purple-500/70 via-blue-500/60 to-blue-400/70
                  rounded-full shadow-lg border border-blue-300/30 backdrop-blur-sm transition-all`}
        style={{ boxShadow: '0 0 15px rgba(139, 92, 246, 0.5)' }}
      >
        <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-600/80 to-blue-500/80">
          <MapPin className="h-5 w-5 text-white/90" strokeWidth={2.2} />
        </div>
        
        {/* Add pulsing effect to button when active */}
        <motion.div 
          className="absolute inset-0 rounded-full"
          animate={{ 
            boxShadow: isClicking 
              ? [
                  '0 0 0 rgba(139, 92, 246, 0)',
                  '0 0 20px rgba(139, 92, 246, 0.8)',
                  '0 0 30px rgba(139, 92, 246, 0.4)',
                  '0 0 0 rgba(139, 92, 246, 0)'
                ] 
              : [
                  '0 0 0 rgba(139, 92, 246, 0)',
                  '0 0 10px rgba(139, 92, 246, 0.7)',
                  '0 0 20px rgba(139, 92, 246, 0.4)',
                  '0 0 0 rgba(139, 92, 246, 0)'
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

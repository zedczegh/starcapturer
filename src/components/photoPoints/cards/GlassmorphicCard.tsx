
import React from 'react';
import { motion } from 'framer-motion';

interface GlassmorphicCardProps {
  children: React.ReactNode;
  isVisible: boolean;
  index: number;
  isMobile?: boolean;
}

const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({ 
  children, 
  isVisible,
  index,
  isMobile = false
}) => {
  // Animation variants - reduced for mobile
  const cardVariants = {
    hidden: { opacity: 0, y: isMobile ? 10 : 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: isMobile ? 0.2 : 0.4,
        delay: isMobile ? Math.min(index * 0.05, 0.3) : Math.min(index * 0.1, 0.5) // Cap maximum delay
      }
    }
  };
  
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      className={`glassmorphism p-4 rounded-lg hover:bg-cosmic-800/30 transition-colors duration-300 border border-cosmic-600/30 ${isMobile ? 'will-change-transform backface-visibility-hidden' : ''}`}
      layout={!isMobile}
    >
      {children}
    </motion.div>
  );
};

export default GlassmorphicCard;

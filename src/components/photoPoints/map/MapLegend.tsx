
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Info } from 'lucide-react';
import { containerVariants } from './utils/legendAnimations';
import LegendHeader from './legends/LegendHeader';
import StarLegend from './legends/StarLegend';
import CircleLegend from './legends/CircleLegend';
import LegendFooter from './legends/LegendFooter';

interface MapLegendProps {
  showStarLegend?: boolean;
  showCircleLegend?: boolean;
  className?: string;
  activeView?: 'certified' | 'calculated';
}

const MapLegend: React.FC<MapLegendProps> = ({ 
  showStarLegend = true, 
  showCircleLegend = true,
  className = "",
  activeView = 'calculated'
}) => {
  // Determine which legends to display based on props and activeView
  const displayStarLegend = showStarLegend || activeView === 'certified';
  const displayCircleLegend = showCircleLegend || activeView === 'calculated';
  
  // State for collapsible behavior
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  
  // Handle hover state with delay for better UX
  useEffect(() => {
    let timer: number;
    
    if (isHovering && isCollapsed) {
      timer = window.setTimeout(() => {
        setIsCollapsed(false);
      }, 300); // Faster delay before expanding
    } else if (!isHovering && !isCollapsed) {
      timer = window.setTimeout(() => {
        setIsCollapsed(true);
      }, 800); // Longer delay before collapsing
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [isHovering, isCollapsed]);
  
  // Animation variants
  const legendVariants = {
    collapsed: {
      x: 'calc(100% - 28px)', // Keep tab visible
      opacity: 0.9,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    expanded: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeIn" }
    }
  };
  
  // Tab variants
  const tabVariants = {
    collapsed: {
      backgroundColor: 'rgba(139, 92, 246, 0.6)',
      boxShadow: '-2px 0px 8px rgba(0, 0, 0, 0.2)',
      transition: { duration: 0.3 }
    },
    expanded: {
      backgroundColor: 'rgba(139, 92, 246, 0.3)',
      boxShadow: '-4px 0px 12px rgba(0, 0, 0, 0.15)',
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div 
      className={`p-3 rounded-lg backdrop-blur-md bg-background/85 border border-primary/30 shadow-lg ${className} absolute bottom-14 right-3 max-w-[250px] z-[999] overflow-hidden`}
      variants={legendVariants}
      initial="collapsed"
      animate={isCollapsed ? "collapsed" : "expanded"}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={() => {
        setIsHovering(true);
        setIsCollapsed(false);
      }}
      style={{
        maxHeight: '80vh',
        backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.05) 100%)',
      }}
    >
      {/* Improved tab for collapsed state */}
      <motion.div 
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full h-28 w-7 
                   flex items-center justify-center rounded-l-md cursor-pointer"
        variants={tabVariants}
        animate={isCollapsed ? "collapsed" : "expanded"}
        style={{
          boxShadow: '-2px 0px 8px rgba(0, 0, 0, 0.2)',
        }}
      >
        <ChevronLeft 
          className="h-5 w-5 text-primary-foreground transform transition-transform"
          style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </motion.div>
      
      {/* Decorative gradients */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
      
      <motion.div 
        className="overflow-y-auto max-h-[calc(80vh-40px)] pr-1 legend-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <LegendHeader />
        
        {displayStarLegend && <StarLegend />}
        
        {displayCircleLegend && <CircleLegend />}
        
        <LegendFooter />
      </motion.div>
    </motion.div>
  );
};

export default MapLegend;

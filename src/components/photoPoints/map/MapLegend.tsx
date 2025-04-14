
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
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
      }, 400); // Delay before expanding
    } else if (!isHovering && !isCollapsed) {
      timer = window.setTimeout(() => {
        setIsCollapsed(true);
      }, 600); // Longer delay before collapsing
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [isHovering, isCollapsed]);
  
  // Animation variants
  const legendVariants = {
    collapsed: {
      x: 'calc(100% - 32px)', // Keep tab visible
      opacity: 0.8,
      transition: { duration: 0.3 }
    },
    expanded: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };
  
  // Tab variants
  const tabVariants = {
    collapsed: {
      backgroundColor: 'rgba(var(--primary-rgb), 0.5)',
      transition: { duration: 0.3 }
    },
    expanded: {
      backgroundColor: 'rgba(var(--primary-rgb), 0.2)',
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div 
      className={`p-3 rounded-lg backdrop-blur-md bg-background/80 border border-primary/20 shadow-lg ${className} absolute bottom-12 right-3 max-w-[250px] z-[999] max-h-[80vh] overflow-hidden`}
      variants={legendVariants}
      initial="collapsed"
      animate={isCollapsed ? "collapsed" : "expanded"}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={() => {
        setIsHovering(true);
        setIsCollapsed(false);
      }}
    >
      {/* Tab for collapsed state */}
      <motion.div 
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full h-24 w-8 
                   flex items-center justify-center rounded-l-md cursor-pointer bg-primary/20"
        variants={tabVariants}
        animate={isCollapsed ? "collapsed" : "expanded"}
      >
        <ChevronLeft 
          className="h-5 w-5 text-primary-foreground transform transition-transform"
          style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </motion.div>
      
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      
      <div className="overflow-y-auto max-h-[calc(80vh-40px)]">
        <LegendHeader />
        
        {displayStarLegend && <StarLegend />}
        
        {displayCircleLegend && <CircleLegend />}
        
        <LegendFooter />
      </div>
    </motion.div>
  );
};

export default MapLegend;

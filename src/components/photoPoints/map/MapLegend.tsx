
import React from 'react';
import { motion } from 'framer-motion';
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
  
  return (
    <motion.div 
      className={`p-3 rounded-lg backdrop-blur-md bg-background/80 border border-primary/20 shadow-lg ${className} absolute bottom-12 right-3 max-w-[250px] z-[999] max-h-[80vh] overflow-y-auto`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      
      <LegendHeader />
      
      {displayStarLegend && <StarLegend />}
      
      {displayCircleLegend && <CircleLegend />}
      
      <LegendFooter />
    </motion.div>
  );
};

export default MapLegend;

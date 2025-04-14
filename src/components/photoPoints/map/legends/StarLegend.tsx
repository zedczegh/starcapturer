
import React from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { itemVariants, hoverMotionProps } from '../utils/legendAnimations';

const StarLegend: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <motion.div 
      className="space-y-2 mb-3.5 bg-muted/20 p-2.5 rounded-md border border-primary/10"
      variants={itemVariants}
    >
      <h4 className="text-xs font-medium text-primary/90 flex items-center">
        <Star className="h-3 w-3 mr-1.5 fill-primary/20" />
        {t("Certified Dark Sky Locations", "认证暗夜地点")}
      </h4>
      <div className="grid grid-cols-1 gap-2.5">
        <StarLegendItem 
          color="#9b87f5"
          delay={0}
          label={t("Dark Sky Reserve/Sanctuary", "暗夜保护区/庇护所")}
        />
        
        <StarLegendItem 
          color="#4ADE80"
          delay={0.5}
          label={t("Dark Sky Park", "暗夜公园")}
        />
        
        <StarLegendItem 
          color="#FFA500"
          delay={1}
          label={t("Dark Sky Community", "暗夜社区")}
        />
        
        <StarLegendItem 
          color="#0EA5E9"
          delay={1.5}
          label={t("Urban Night Sky", "城市夜空地点")}
        />
      </div>
    </motion.div>
  );
};

interface StarLegendItemProps {
  color: string;
  delay: number;
  label: string;
}

const StarLegendItem: React.FC<StarLegendItemProps> = ({ color, delay, label }) => {
  // Create animation settings object without conditionals
  const animationProps = {
    boxShadow: [
      `0 0 0 rgba(${hexToRgb(color)}, 0)`, 
      `0 0 8px rgba(${hexToRgb(color)}, 0.5)`, 
      `0 0 0 rgba(${hexToRgb(color)}, 0)`
    ]
  };
  
  return (
    <motion.div 
      className="flex items-center"
      {...hoverMotionProps}
    >
      <motion.div 
        className="bg-muted/30 p-1 rounded-full mr-2 border"
        style={{ borderColor: `${color}33` }}
        animate={animationProps}
        transition={{ duration: 3, repeat: Infinity, delay }}
      >
        <Star 
          className="h-3.5 w-3.5" 
          style={{ color, fill: color }}
        />
      </motion.div>
      <span className="text-xs">
        {label}
      </span>
    </motion.div>
  );
};

// Helper function to convert hex color to RGB for animations
function hexToRgb(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  
  return `${r}, ${g}, ${b}`;
}

export default StarLegend;

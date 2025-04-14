
import React from 'react';
import { Circle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { itemVariants, hoverMotionProps } from '../utils/legendAnimations';

const CircleLegend: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <motion.div 
      className="space-y-2 bg-muted/20 p-2.5 rounded-md border border-primary/10"
      variants={itemVariants}
    >
      <h4 className="text-xs font-medium text-primary/90 flex items-center">
        <Info className="h-3 w-3 mr-1.5 text-primary/80" />
        {t("Calculated Locations (SIQS Score)", "计算地点（SIQS评分）")}
      </h4>
      <div className="grid grid-cols-1 gap-2.5">
        <CircleLegendItem 
          color="green-500"
          colorRgb="34, 197, 94"
          delay={0}
          label={t("Excellent (7.5-10)", "极佳 (7.5-10)")}
        />
        
        <CircleLegendItem 
          color="yellow-500"
          colorRgb="234, 179, 8"
          delay={0.5}
          label={t("Good (5.5-7.4)", "良好 (5.5-7.4)")}
        />
        
        <CircleLegendItem 
          color="orange-500"
          colorRgb="249, 115, 22"
          delay={1}
          label={t("Average (4.0-5.4)", "一般 (4.0-5.4)")}
        />
        
        <CircleLegendItem 
          color="red-500"
          colorRgb="239, 68, 68"
          delay={1.5}
          label={t("Below Average (<4.0)", "较差 (<4.0)")}
        />
      </div>
    </motion.div>
  );
};

interface CircleLegendItemProps {
  color: string;
  colorRgb: string;
  delay: number;
  label: string;
}

const CircleLegendItem: React.FC<CircleLegendItemProps> = ({ 
  color, 
  colorRgb,
  delay, 
  label 
}) => {
  // Create animation settings object without conditionals
  const animationProps = {
    boxShadow: [
      `0 0 0 rgba(${colorRgb}, 0)`, 
      `0 0 8px rgba(${colorRgb}, 0.5)`, 
      `0 0 0 rgba(${colorRgb}, 0)`
    ]
  };
  
  return (
    <motion.div 
      className="flex items-center"
      {...hoverMotionProps}
    >
      <motion.div 
        className={`bg-muted/30 p-1 rounded-full mr-2 border border-${color}/20`}
        animate={animationProps}
        transition={{ duration: 3, repeat: Infinity, delay }}
      >
        <Circle className={`h-3.5 w-3.5 text-${color} fill-${color}/30`} />
      </motion.div>
      <span className="text-xs">
        {label}
      </span>
    </motion.div>
  );
};

export default CircleLegend;

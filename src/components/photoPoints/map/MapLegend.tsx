
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star, Circle, Info, Satellite } from 'lucide-react';
import { motion } from 'framer-motion';

interface MapLegendProps {
  showStarLegend: boolean;
  showCircleLegend: boolean;
  className?: string;
}

const MapLegend: React.FC<MapLegendProps> = ({ 
  showStarLegend = true, 
  showCircleLegend = true,
  className = ""
}) => {
  const { t } = useLanguage();
  
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };
  
  const pulseVariants = {
    pulse: {
      boxShadow: [
        '0 0 0 0 rgba(139, 92, 246, 0)',
        '0 0 0 4px rgba(139, 92, 246, 0.2)',
        '0 0 0 0 rgba(139, 92, 246, 0)'
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatDelay: 1
      }
    }
  };

  return (
    <motion.div 
      className={`p-3.5 rounded-lg backdrop-blur-md bg-background/80 border border-primary/20 shadow-lg ${className} relative overflow-hidden`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Sci-fi decorative elements */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      
      <motion.div 
        className="flex items-center mb-2"
        variants={itemVariants}
      >
        <Satellite className="h-4 w-4 mr-1.5 text-primary" />
        <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
          {t("Map Indicators Guide", "地图标记指南")}
        </span>
      </motion.div>
      
      {showStarLegend && (
        <motion.div 
          className="space-y-2 mb-3.5 bg-muted/20 p-2.5 rounded-md border border-primary/10"
          variants={itemVariants}
        >
          <h4 className="text-xs font-medium text-primary/90 flex items-center">
            <Star className="h-3 w-3 mr-1.5 fill-primary/20" />
            {t("Certified Dark Sky Locations", "认证暗夜地点")}
          </h4>
          <div className="grid grid-cols-1 gap-2.5">
            <motion.div 
              className="flex items-center"
              whileHover={{ x: 3 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <motion.div 
                className="bg-muted/30 p-1 rounded-full mr-2 border border-[#9b87f5]/20"
                animate={{ 
                  boxShadow: ['0 0 0 rgba(155, 135, 245, 0)', '0 0 8px rgba(155, 135, 245, 0.5)', '0 0 0 rgba(155, 135, 245, 0)'] 
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Star className="h-3.5 w-3.5 text-[#9b87f5] fill-[#9b87f5]" />
              </motion.div>
              <span className="text-xs">
                {t("Dark Sky Reserve/Sanctuary", "暗夜保护区/庇护所")}
              </span>
            </motion.div>
            
            <motion.div 
              className="flex items-center"
              whileHover={{ x: 3 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <motion.div 
                className="bg-muted/30 p-1 rounded-full mr-2 border border-[#4ADE80]/20"
                animate={{ 
                  boxShadow: ['0 0 0 rgba(74, 222, 128, 0)', '0 0 8px rgba(74, 222, 128, 0.5)', '0 0 0 rgba(74, 222, 128, 0)'] 
                }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              >
                <Star className="h-3.5 w-3.5 text-[#4ADE80] fill-[#4ADE80]" />
              </motion.div>
              <span className="text-xs">
                {t("Dark Sky Park", "暗夜公园")}
              </span>
            </motion.div>
            
            <motion.div 
              className="flex items-center"
              whileHover={{ x: 3 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <motion.div 
                className="bg-muted/30 p-1 rounded-full mr-2 border border-[#FFA500]/20"
                animate={{ 
                  boxShadow: ['0 0 0 rgba(255, 165, 0, 0)', '0 0 8px rgba(255, 165, 0, 0.5)', '0 0 0 rgba(255, 165, 0, 0)'] 
                }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              >
                <Star className="h-3.5 w-3.5 text-[#FFA500] fill-[#FFA500]" />
              </motion.div>
              <span className="text-xs">
                {t("Dark Sky Community", "暗夜社区")}
              </span>
            </motion.div>
            
            <motion.div 
              className="flex items-center"
              whileHover={{ x: 3 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <motion.div 
                className="bg-muted/30 p-1 rounded-full mr-2 border border-[#0EA5E9]/20"
                animate={{ 
                  boxShadow: ['0 0 0 rgba(14, 165, 233, 0)', '0 0 8px rgba(14, 165, 233, 0.5)', '0 0 0 rgba(14, 165, 233, 0)'] 
                }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              >
                <Star className="h-3.5 w-3.5 text-[#0EA5E9] fill-[#0EA5E9]" />
              </motion.div>
              <span className="text-xs">
                {t("Urban Night Sky", "城市夜空地点")}
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
      
      {showCircleLegend && (
        <motion.div 
          className="space-y-2 bg-muted/20 p-2.5 rounded-md border border-primary/10"
          variants={itemVariants}
        >
          <h4 className="text-xs font-medium text-primary/90 flex items-center">
            <Info className="h-3 w-3 mr-1.5 text-primary/80" />
            {t("Calculated Locations (SIQS Score)", "计算地点（SIQS评分）")}
          </h4>
          <div className="grid grid-cols-1 gap-2.5">
            <motion.div 
              className="flex items-center"
              whileHover={{ x: 3 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <motion.div 
                className="bg-muted/30 p-1 rounded-full mr-2 border border-green-500/20"
                variants={pulseVariants}
                animate="pulse"
              >
                <Circle className="h-3.5 w-3.5 text-green-500 fill-green-500/30" />
              </motion.div>
              <span className="text-xs">
                {t("Excellent (7.5-10)", "极佳 (7.5-10)")}
              </span>
            </motion.div>
            
            <motion.div 
              className="flex items-center"
              whileHover={{ x: 3 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <motion.div 
                className="bg-muted/30 p-1 rounded-full mr-2 border border-yellow-500/20"
                animate={{ 
                  boxShadow: ['0 0 0 rgba(234, 179, 8, 0)', '0 0 8px rgba(234, 179, 8, 0.5)', '0 0 0 rgba(234, 179, 8, 0)'] 
                }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              >
                <Circle className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500/30" />
              </motion.div>
              <span className="text-xs">
                {t("Good (5.5-7.4)", "良好 (5.5-7.4)")}
              </span>
            </motion.div>
            
            <motion.div 
              className="flex items-center"
              whileHover={{ x: 3 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <motion.div 
                className="bg-muted/30 p-1 rounded-full mr-2 border border-orange-500/20"
                animate={{ 
                  boxShadow: ['0 0 0 rgba(249, 115, 22, 0)', '0 0 8px rgba(249, 115, 22, 0.5)', '0 0 0 rgba(249, 115, 22, 0)'] 
                }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              >
                <Circle className="h-3.5 w-3.5 text-orange-500 fill-orange-500/30" />
              </motion.div>
              <span className="text-xs">
                {t("Average (4.0-5.4)", "一般 (4.0-5.4)")}
              </span>
            </motion.div>
            
            <motion.div 
              className="flex items-center"
              whileHover={{ x: 3 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <motion.div 
                className="bg-muted/30 p-1 rounded-full mr-2 border border-red-500/20"
                animate={{ 
                  boxShadow: ['0 0 0 rgba(239, 68, 68, 0)', '0 0 8px rgba(239, 68, 68, 0.5)', '0 0 0 rgba(239, 68, 68, 0)'] 
                }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              >
                <Circle className="h-3.5 w-3.5 text-red-500 fill-red-500/30" />
              </motion.div>
              <span className="text-xs">
                {t("Below Average (<4.0)", "较差 (<4.0)")}
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
      
      <motion.div 
        className="mt-3 text-xs text-muted-foreground bg-background/70 p-2 rounded-md border border-primary/10 shadow-sm"
        variants={itemVariants}
      >
        <motion.p
          animate={{ 
            textShadow: ['0 0 0px rgba(139, 92, 246, 0)', '0 0 2px rgba(139, 92, 246, 0.5)', '0 0 0px rgba(139, 92, 246, 0)'] 
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {t(
            "Tap any marker for details or click anywhere to select that location.",
            "点击任意标记查看详情，或点击地图任意位置选择该位置。"
          )}
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default MapLegend;

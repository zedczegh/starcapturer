
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { itemVariants } from '../utils/legendAnimations';

const LegendFooter: React.FC = () => {
  const { t } = useLanguage();
  
  // Define animation properties to avoid conditional hook usage
  const textAnimateProps = { 
    textShadow: ['0 0 0px rgba(139, 92, 246, 0)', '0 0 2px rgba(139, 92, 246, 0.5)', '0 0 0px rgba(139, 92, 246, 0)'] 
  };
  
  return (
    <motion.div 
      className="mt-3 text-xs text-muted-foreground bg-background/70 p-2 rounded-md border border-primary/10 shadow-sm"
      variants={itemVariants}
    >
      <motion.p
        animate={textAnimateProps}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {t(
          "Tap any marker for details or click anywhere to select that location.",
          "点击任意标记查看详情，或点击地图任意位置选择该位置。"
        )}
      </motion.p>
    </motion.div>
  );
};

export default LegendFooter;

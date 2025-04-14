
import React from 'react';
import { Satellite } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { itemVariants } from '../utils/legendAnimations';

const LegendHeader: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <motion.div 
      className="flex items-center mb-2"
      variants={itemVariants}
    >
      <Satellite className="h-4 w-4 mr-1.5 text-primary" />
      <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
        {t("Map Indicators Guide", "地图标记指南")}
      </span>
    </motion.div>
  );
};

export default LegendHeader;

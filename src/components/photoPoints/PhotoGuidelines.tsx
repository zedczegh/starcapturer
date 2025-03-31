
import React from 'react';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Camera, Moon, CloudOff, MountainSnow, Star, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const PhotoGuidelines: React.FC = () => {
  const { t, language } = useLanguage();
  
  const guidelines = [
    {
      icon: <Moon className="h-5 w-5 text-blue-400" />,
      title: t("Dark Skies", "暗夜天空"),
      description: t("Find locations with minimal light pollution", "寻找光污染最小的位置")
    },
    {
      icon: <CloudOff className="h-5 w-5 text-yellow-400" />,
      title: t("Clear Weather", "晴朗天气"),
      description: t("Check weather forecasts before heading out", "出发前先查看天气预报")
    },
    {
      icon: <MountainSnow className="h-5 w-5 text-green-400" />,
      title: t("Elevated Position", "地势高点"),
      description: t("Higher ground often means better views", "较高的位置通常意味着更好的视野")
    },
    {
      icon: <Star className="h-5 w-5 text-purple-400" />,
      title: t("Stable Setup", "稳定设置"),
      description: t("Use a tripod for sharper images", "使用三脚架拍摄更清晰的图像")
    }
  ];
  
  const variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <Card className="p-4 glassmorphism overflow-hidden">
      <div className="flex items-center mb-3">
        <Camera className="h-5 w-5 text-primary mr-2" />
        <h3 className="text-base font-medium">{t("Photo Guidelines", "拍照指南")}</h3>
      </div>
      
      <motion.div 
        className="space-y-3"
        variants={variants}
        initial="hidden"
        animate="show"
      >
        {guidelines.map((guideline, index) => (
          <motion.div 
            key={index}
            variants={itemVariants}
            className="flex items-start p-2 rounded-md hover:bg-cosmic-800/30 transition-colors"
          >
            <div className="mt-0.5 mr-3">{guideline.icon}</div>
            <div>
              <h4 className="text-sm font-medium">{guideline.title}</h4>
              <p className="text-xs text-muted-foreground">{guideline.description}</p>
            </div>
          </motion.div>
        ))}
        
        <motion.div 
          variants={itemVariants}
          className="mt-4 pt-3 border-t border-cosmic-700/30 flex items-center text-sm text-muted-foreground"
        >
          <Sparkles className="h-4 w-4 text-yellow-500 mr-2 animate-pulse" />
          <span>
            {language === 'en' ? 
              "Share amazing photo points with our community" : 
              "与我们的社区分享精彩拍摄点"}
          </span>
        </motion.div>
      </motion.div>
    </Card>
  );
};

export default PhotoGuidelines;

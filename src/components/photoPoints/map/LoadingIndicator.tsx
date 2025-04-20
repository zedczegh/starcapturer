
import React from 'react';
import { Loader } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

interface LoadingIndicatorProps {
  progress?: number;
  message?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  progress = 0, 
  message 
}) => {
  const { t } = useLanguage();
  
  return (
    <motion.div 
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="flex flex-col items-center space-y-4 bg-card p-6 rounded-lg shadow-lg"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          <Loader className="h-8 w-8 text-primary" />
        </motion.div>
        
        <div className="text-center">
          <motion.p 
            className="text-sm font-medium"
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {message || t("Loading certified locations...", "正在加载认证位置...")}
          </motion.p>
          
          <div className="w-48 mt-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.5 }}
            >
              <Progress value={progress} className="h-2" />
            </motion.div>
            <motion.p 
              className="text-xs text-muted-foreground mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {progress}%
            </motion.p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoadingIndicator;

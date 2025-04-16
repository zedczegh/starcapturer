
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Stars, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface EnhancedLoaderProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  progress?: number;
}

const EnhancedLoader: React.FC<EnhancedLoaderProps> = ({
  size = 'medium',
  message,
  progress
}) => {
  const { theme } = useTheme();
  const [randomTip, setRandomTip] = useState<string>('');
  const isDark = theme === 'dark';
  
  const tips = [
    'Clear skies produce better visibility for stargazing',
    'The darkest skies are found away from city lights',
    'Full moons can wash out the visibility of stars',
    'SIQS above 7 is considered excellent for astrophotography',
    'Lower humidity often means better viewing conditions',
  ];
  
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * tips.length);
    setRandomTip(tips[randomIndex]);
  }, []);
  
  // Determine size values
  const sizeValues = {
    small: {
      containerClass: 'p-3',
      iconSize: 18,
      iconClass: 'w-4 h-4',
      textClass: 'text-xs',
    },
    medium: {
      containerClass: 'p-5',
      iconSize: 24,
      iconClass: 'w-6 h-6',
      textClass: 'text-sm',
    },
    large: {
      containerClass: 'p-8',
      iconSize: 32,
      iconClass: 'w-8 h-8',
      textClass: 'text-base',
    },
  };
  
  const sizeConfig = sizeValues[size];
  
  return (
    <AnimatePresence>
      <div className="flex flex-col items-center justify-center w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`relative ${sizeConfig.containerClass} bg-card/80 backdrop-blur-md rounded-lg shadow-lg border border-border/50 flex flex-col items-center`}
        >
          <div className="relative flex items-center justify-center mb-2">
            {/* Main loader */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className={`text-primary ${sizeConfig.iconClass}`} size={sizeConfig.iconSize} />
            </motion.div>
            
            {/* Orbiting celestial bodies */}
            <motion.div
              className="absolute"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{ width: sizeConfig.iconSize * 3, height: sizeConfig.iconSize * 3 }}
            >
              <motion.div
                className="absolute"
                style={{ left: '50%', top: 0, transform: 'translate(-50%, -50%)' }}
              >
                <Stars className={`text-blue-400 ${sizeConfig.iconClass}`} size={sizeConfig.iconSize * 0.6} />
              </motion.div>
            </motion.div>
            
            <motion.div
              className="absolute"
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              style={{ width: sizeConfig.iconSize * 4, height: sizeConfig.iconSize * 4 }}
            >
              <motion.div
                className="absolute"
                style={{ left: '30%', top: '70%', transform: 'translate(-50%, -50%)' }}
              >
                {isDark ? (
                  <Moon className={`text-gray-200 ${sizeConfig.iconClass}`} size={sizeConfig.iconSize * 0.5} />
                ) : (
                  <Sun className={`text-yellow-400 ${sizeConfig.iconClass}`} size={sizeConfig.iconSize * 0.5} />
                )}
              </motion.div>
            </motion.div>
          </div>
          
          {message && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`${sizeConfig.textClass} text-center text-foreground font-medium mt-2`}
            >
              {message}
            </motion.p>
          )}
          
          {progress !== undefined && (
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-1 bg-primary rounded-full mt-2"
              style={{ width: `${progress}%` }}
            />
          )}
          
          {size !== 'small' && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xs text-muted-foreground mt-3 max-w-xs text-center"
            >
              {randomTip}
            </motion.p>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EnhancedLoader;

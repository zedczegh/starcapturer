import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, MapPin, Stars, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'cosmic' | 'gradient';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  variant = 'primary',
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const variantClasses = {
    primary: 'text-primary',
    cosmic: 'text-cosmic-400',
    gradient: 'bg-gradient-to-r from-primary to-cosmic-400'
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={cn(sizeClasses[size], variantClasses[variant], className)}
    >
      <Loader2 className="h-full w-full" />
    </motion.div>
  );
};

interface FloatingIconsProps {
  icons?: React.ComponentType<any>[];
  className?: string;
}

export const FloatingIcons: React.FC<FloatingIconsProps> = ({ 
  icons = [Sparkles, MapPin, Stars, Camera],
  className 
}) => {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {icons.map((Icon, index) => (
        <motion.div
          key={index}
          className="absolute"
          initial={{ 
            opacity: 0, 
            scale: 0,
            x: Math.random() * 300,
            y: Math.random() * 300
          }}
          animate={{ 
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
            y: [-20, -80],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: index * 0.5,
            ease: "easeOut"
          }}
          style={{
            left: `${20 + (index * 20)}%`,
            top: `${60 + (index * 5)}%`,
          }}
        >
          <Icon className="h-6 w-6 text-primary/30" />
        </motion.div>
      ))}
    </div>
  );
};

interface ProgressBarProps {
  progress?: number;
  indeterminate?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress = 0, 
  indeterminate = false,
  className 
}) => {
  return (
    <div className={cn("w-full bg-cosmic-800/20 rounded-full h-1 overflow-hidden", className)}>
      {indeterminate ? (
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-cosmic-400 rounded-full"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut"
          }}
          style={{ width: "30%" }}
        />
      ) : (
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-cosmic-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      )}
    </div>
  );
};

interface PulsingDotsProps {
  count?: number;
  className?: string;
}

export const PulsingDots: React.FC<PulsingDotsProps> = ({ 
  count = 3,
  className 
}) => {
  return (
    <div className={cn("flex space-x-1", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className="w-2 h-2 bg-primary rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2
          }}
        />
      ))}
    </div>
  );
};

interface EnhancedLoadingFallbackProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
  variant?: 'minimal' | 'detailed' | 'cosmic';
  className?: string;
}

export const EnhancedLoadingFallback: React.FC<EnhancedLoadingFallbackProps> = ({
  message = "Loading amazing astronomy content...",
  showProgress = false,
  progress = 0,
  variant = 'detailed',
  className
}) => {
  const variants = {
    minimal: (
      <div className="flex items-center space-x-3">
        <LoadingSpinner size="md" />
        <span className="text-cosmic-200">{message}</span>
      </div>
    ),
    detailed: (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center space-y-6 relative"
      >
        <FloatingIcons />
        <div className="relative">
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 20px rgba(107, 107, 255, 0.3)",
                "0 0 40px rgba(107, 107, 255, 0.6)",
                "0 0 20px rgba(107, 107, 255, 0.3)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-4 rounded-full bg-cosmic-900/80 backdrop-blur-sm"
          >
            <LoadingSpinner size="lg" variant="gradient" />
          </motion.div>
        </div>
        <div className="text-center space-y-3">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-cosmic-200 text-lg font-medium"
          >
            {message}
          </motion.p>
          {showProgress && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "100%" }}
              transition={{ delay: 0.5 }}
              className="w-64"
            >
              <ProgressBar progress={progress} indeterminate={!progress} />
            </motion.div>
          )}
          <PulsingDots />
        </div>
      </motion.div>
    ),
    cosmic: (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center space-y-4 relative"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-2 border-transparent border-t-primary/30 border-r-cosmic-400/30 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 border border-transparent border-t-cosmic-300/20 border-l-primary/20 rounded-full"
          />
          <div className="w-16 h-16 flex items-center justify-center">
            <Stars className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </div>
        <motion.p 
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-cosmic-200 font-medium"
        >
          {message}
        </motion.p>
      </motion.div>
    )
  };

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center bg-gradient-to-br from-cosmic-950 via-cosmic-900 to-cosmic-950",
      className
    )}>
      {variants[variant]}
    </div>
  );
};
import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Mountain, Cloud, Wind } from 'lucide-react';
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
      animate={{ 
        rotate: 360,
        scale: [1, 1.1, 1]
      }}
      transition={{ 
        rotate: { duration: 2, repeat: Infinity, ease: "linear" },
        scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
      }}
      className={cn(sizeClasses[size], variantClasses[variant], className)}
    >
      <Compass className="h-full w-full" />
    </motion.div>
  );
};

interface FloatingIconsProps {
  icons?: React.ComponentType<any>[];
  className?: string;
}

export const FloatingIcons: React.FC<FloatingIconsProps> = ({ 
  icons = [Mountain, Cloud, Wind, Compass],
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
            scale: 0.8,
            x: `${20 + (index * 20)}%`,
            y: `${40 + (index * 10)}%`
          }}
          animate={{ 
            opacity: [0, 0.8, 0],
            scale: [0.8, 1.2, 0.8],
            x: `${20 + (index * 20) + Math.sin(index) * 10}%`,
            y: [`${40 + (index * 10)}%`, `${30 + (index * 10)}%`, `${40 + (index * 10)}%`],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: index * 0.4,
            ease: "easeInOut"
          }}
        >
          <Icon className="h-8 w-8 text-primary/40" strokeWidth={1.5} />
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
  message = "Into the Unknown",
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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center space-y-8 relative"
      >
        <FloatingIcons />
        <div className="relative">
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ 
              boxShadow: [
                "0 0 30px rgba(200, 120, 80, 0.4)",
                "0 0 50px rgba(200, 120, 80, 0.6)",
                "0 0 30px rgba(200, 120, 80, 0.4)"
              ],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            animate={{ 
              rotate: [0, 360]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="p-6 rounded-full bg-cosmic-900/90 backdrop-blur-md border border-primary/20"
          >
            <LoadingSpinner size="lg" variant="primary" />
          </motion.div>
        </div>
        <div className="text-center space-y-4">
        <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-cosmic-100 text-2xl font-bold tracking-wide"
          >
            {message}
          </motion.p>
          <PulsingDots />
        </div>
      </motion.div>
    ),
    cosmic: (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center space-y-6 relative"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-2 border-transparent border-t-primary/40 border-r-accent/30 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 border border-transparent border-t-cosmic-300/30 border-l-primary/20 rounded-full"
          />
          <div className="w-20 h-20 flex items-center justify-center">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <Compass className="h-10 w-10 text-primary" strokeWidth={2} />
            </motion.div>
          </div>
        </div>
        <motion.p 
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-cosmic-200 font-semibold text-lg"
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
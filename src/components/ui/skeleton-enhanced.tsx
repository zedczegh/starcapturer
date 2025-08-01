import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'shimmer' | 'pulse' | 'wave';
  animate?: boolean;
}

export const EnhancedSkeleton: React.FC<SkeletonProps> = ({ 
  className, 
  variant = 'shimmer',
  animate = true,
  ...props 
}) => {
  const baseClasses = "bg-cosmic-800/40 rounded";
  
  const variants = {
    default: baseClasses,
    shimmer: cn(baseClasses, "relative overflow-hidden"),
    pulse: cn(baseClasses, animate ? "animate-pulse" : ""),
    wave: cn(baseClasses, "relative overflow-hidden")
  };

  const shimmerOverlay = variant === 'shimmer' && (
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
      initial={{ x: "-100%" }}
      animate={{ x: "100%" }}
      transition={{
        repeat: Infinity,
        duration: 1.5,
        ease: "easeInOut"
      }}
    />
  );

  const waveOverlay = variant === 'wave' && (
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
      initial={{ x: "-100%" }}
      animate={{ x: "200%" }}
      transition={{
        repeat: Infinity,
        duration: 2,
        ease: "easeInOut",
        delay: Math.random() * 0.5
      }}
    />
  );

  return (
    <div className={cn(variants[variant], className)} {...props}>
      {shimmerOverlay}
      {waveOverlay}
    </div>
  );
};

interface CardSkeletonProps {
  className?: string;
  showImage?: boolean;
  showAvatar?: boolean;
  lines?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  className,
  showImage = true,
  showAvatar = false,
  lines = 3
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("p-4 space-y-4 bg-cosmic-900/50 rounded-lg border border-cosmic-800/30", className)}
    >
      {showImage && (
        <EnhancedSkeleton className="h-32 w-full" variant="shimmer" />
      )}
      
      <div className="space-y-3">
        {showAvatar && (
          <div className="flex items-center space-x-3">
            <EnhancedSkeleton className="h-10 w-10 rounded-full" variant="pulse" />
            <div className="space-y-2 flex-1">
              <EnhancedSkeleton className="h-4 w-24" variant="wave" />
              <EnhancedSkeleton className="h-3 w-16" variant="wave" />
            </div>
          </div>
        )}
        
        {Array.from({ length: lines }).map((_, index) => (
          <EnhancedSkeleton 
            key={index}
            className={cn(
              "h-4",
              index === 0 ? "w-3/4" : 
              index === lines - 1 ? "w-1/2" : "w-full"
            )}
            variant="shimmer"
          />
        ))}
      </div>
      
      <div className="flex space-x-2">
        <EnhancedSkeleton className="h-8 w-20" variant="pulse" />
        <EnhancedSkeleton className="h-8 w-16" variant="pulse" />
      </div>
    </motion.div>
  );
};

interface GridSkeletonProps {
  count?: number;
  columns?: number;
  className?: string;
}

export const GridSkeleton: React.FC<GridSkeletonProps> = ({
  count = 6,
  columns = 3,
  className
}) => {
  return (
    <div className={cn(
      `grid gap-4`,
      `grid-cols-1 md:grid-cols-${Math.min(columns, 2)} lg:grid-cols-${columns}`,
      className
    )}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <CardSkeleton showImage showAvatar />
        </motion.div>
      ))}
    </div>
  );
};

interface ListSkeletonProps {
  count?: number;
  className?: string;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  count = 5,
  className
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center space-x-4 p-4 bg-cosmic-900/30 rounded-lg"
        >
          <EnhancedSkeleton className="h-12 w-12 rounded-full" variant="pulse" />
          <div className="flex-1 space-y-2">
            <EnhancedSkeleton className="h-4 w-3/4" variant="shimmer" />
            <EnhancedSkeleton className="h-3 w-1/2" variant="wave" />
          </div>
          <EnhancedSkeleton className="h-8 w-16" variant="pulse" />
        </motion.div>
      ))}
    </div>
  );
};
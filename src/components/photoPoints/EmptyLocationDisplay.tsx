
import React, { memo } from 'react';
import { Filter, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface EmptyLocationDisplayProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
  animated?: boolean;
}

/**
 * Enhanced empty location display with animation options and better performance
 */
const EmptyLocationDisplay: React.FC<EmptyLocationDisplayProps> = memo(({
  title,
  description,
  icon = <Filter className="h-12 w-12 text-muted-foreground/40" />,
  onAction,
  actionLabel,
  className,
  animated = true
}) => {
  const containerClass = cn(
    "py-12 text-center",
    className
  );
  
  // Framer motion animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
  };
  
  // Conditional rendering based on animation preference
  if (animated) {
    return (
      <motion.div 
        className={containerClass}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <motion.div 
            className="flex justify-center bg-muted/30 rounded-full p-4 backdrop-blur-sm"
            variants={itemVariants}
          >
            {icon}
          </motion.div>
          
          <motion.h3 
            className="text-lg font-medium text-muted-foreground"
            variants={itemVariants}
          >
            {title}
          </motion.h3>
          
          <motion.p 
            className="text-sm text-muted-foreground/80 max-w-md mx-auto"
            variants={itemVariants}
          >
            {description}
          </motion.p>
          
          {onAction && actionLabel && (
            <motion.div variants={itemVariants}>
              <Button 
                variant="outline"
                onClick={onAction}
                className="mt-4"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {actionLabel}
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }
  
  // Non-animated version for better performance on lower-end devices
  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="flex justify-center bg-muted/30 rounded-full p-4">
          {icon}
        </div>
        
        <h3 className="text-lg font-medium text-muted-foreground">
          {title}
        </h3>
        
        <p className="text-sm text-muted-foreground/80 max-w-md mx-auto">
          {description}
        </p>
        
        {onAction && actionLabel && (
          <Button 
            variant="outline"
            onClick={onAction}
            className="mt-4"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
});

// Add display name for easier debugging
EmptyLocationDisplay.displayName = 'EmptyLocationDisplay';

export default EmptyLocationDisplay;

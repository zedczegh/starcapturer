
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const AstroSpotsLoadingSkeleton = () => {
  const isMobile = useIsMobile();
  // Show fewer skeleton cards on mobile
  const count = isMobile ? 3 : 6;
  
  // Use staggered animation variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.2 } 
    }
  };
  
  // Less detailed skeletons on mobile
  const isReducedMotion = isMobile;

  return (
    <motion.div 
      className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {[...Array(count)].map((_, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          className="relative"
        >
          <div className={`bg-cosmic-900/60 glassmorphism rounded-xl border border-cosmic-700/40 
                          shadow-glow p-${isMobile ? '3' : '4'}`}>
            <Skeleton className={`h-${isMobile ? '24' : '32'} w-full rounded-lg bg-cosmic-800/40 mb-3`} />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4 bg-cosmic-800/40" />
              {!isMobile && <Skeleton className="h-4 w-1/2 bg-cosmic-800/40" />}
              <div className="flex gap-2 mt-2">
                <Skeleton className="h-8 w-8 rounded-full bg-cosmic-800/40" />
                <Skeleton className="h-8 w-20 bg-cosmic-800/40" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default React.memo(AstroSpotsLoadingSkeleton);

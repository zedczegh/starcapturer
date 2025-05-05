
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const AstroSpotsLoadingSkeleton = () => {
  const isMobile = useIsMobile();
  // Show fewer skeleton cards on mobile
  const count = isMobile ? 2 : 4;
  
  // Single staggered animation container for better performance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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

  return (
    <motion.div 
      className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'sm:grid-cols-1 md:grid-cols-2'}`}
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
          <div className="bg-cosmic-900/60 rounded-xl border border-cosmic-700/40 shadow-sm p-3">
            <Skeleton className="h-20 w-full rounded-lg bg-cosmic-800/40 mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4 bg-cosmic-800/40" />
              <div className="flex gap-2 mt-2">
                <Skeleton className="h-5 w-5 rounded-full bg-cosmic-800/40" />
                <Skeleton className="h-5 w-20 bg-cosmic-800/40" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default React.memo(AstroSpotsLoadingSkeleton);


import React from 'react';
import { motion } from 'framer-motion';
import { GridSkeleton } from '@/components/ui/skeleton-enhanced';

const AstroSpotsLoadingSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="loading-shimmer h-8 w-64 rounded" />
        <div className="loading-shimmer h-4 w-96 rounded" />
      </div>
      
      {/* Grid skeleton with enhanced animations */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="relative"
          >
            <div className="bg-cosmic-900/60 glassmorphism rounded-xl border border-cosmic-700/40 shadow-glow p-4">
              <div className="loading-shimmer h-32 w-full rounded-lg mb-4" />
              <div className="space-y-2">
                <div className="loading-shimmer h-4 w-3/4 rounded" />
                <div className="loading-shimmer h-4 w-1/2 rounded" />
                <div className="flex gap-2 mt-3">
                  <div className="loading-shimmer h-8 w-8 rounded-full" />
                  <div className="loading-shimmer h-8 w-20 rounded" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default AstroSpotsLoadingSkeleton;

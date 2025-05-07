
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const AstroSpotsLoadingSkeleton = () => {
  return (
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
            <Skeleton className="h-32 w-full rounded-lg bg-cosmic-800/40 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4 bg-cosmic-800/40" />
              <Skeleton className="h-4 w-1/2 bg-cosmic-800/40" />
              <div className="flex gap-2 mt-3">
                <Skeleton className="h-8 w-8 rounded-full bg-cosmic-800/40" />
                <Skeleton className="h-8 w-20 bg-cosmic-800/40" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default AstroSpotsLoadingSkeleton;

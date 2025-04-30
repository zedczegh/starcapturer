
import React from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const CommunityLocationsSkeleton = () => {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="p-5 rounded-xl border border-cosmic-700/30 bg-cosmic-900/50 backdrop-blur-sm overflow-hidden"
          style={{ animationDelay: `${i * 150}ms` }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-7 w-2/3 bg-cosmic-800/50" />
              <Skeleton className="h-6 w-14 rounded-full bg-cosmic-800/50" />
            </div>
            <div className="space-y-3 mt-2">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-5 rounded-full bg-cosmic-800/50" />
                <Skeleton className="h-5 w-32 bg-cosmic-800/50" />
              </div>
              <div className="flex gap-2 items-center">
                <Skeleton className="h-4 w-4 rounded-full bg-cosmic-800/50" />
                <Skeleton className="h-4 w-40 bg-cosmic-800/50" />
              </div>
              <div className="pt-3 flex justify-end">
                <Skeleton className="h-8 w-24 rounded-full bg-cosmic-800/50" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default CommunityLocationsSkeleton;

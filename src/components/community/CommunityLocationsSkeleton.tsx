
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const CommunityLocationsSkeleton = () => {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-lg border border-cosmic-700/20 bg-cosmic-900/50 backdrop-blur-sm animate-in fade-in-50 duration-500"
          style={{ animationDelay: `${i * 150}ms` }}
        >
          <div className="space-y-3">
            <Skeleton className="h-6 w-2/3 bg-cosmic-800/50" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-20 bg-cosmic-800/50" />
              <Skeleton className="h-4 w-20 bg-cosmic-800/50" />
            </div>
            <div className="flex gap-2 items-center">
              <Skeleton className="h-4 w-4 rounded-full bg-cosmic-800/50" />
              <Skeleton className="h-4 w-32 bg-cosmic-800/50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommunityLocationsSkeleton;

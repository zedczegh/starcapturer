
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

const CommunityLocationsSkeleton = () => {
  const isMobile = useIsMobile();
  const skeletonCount = isMobile ? 2 : 3;
  
  return (
    <div className="space-y-4">
      {[...Array(skeletonCount)].map((_, i) => (
        <div
          key={i}
          className="p-3 rounded-lg border border-cosmic-700/20 bg-cosmic-900/50 backdrop-blur-sm animate-in fade-in-50 duration-300"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="space-y-2">
            <Skeleton className="h-5 w-2/3 bg-cosmic-800/40" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16 bg-cosmic-800/40" />
              <Skeleton className="h-4 w-16 bg-cosmic-800/40" />
            </div>
            <div className="flex gap-2 items-center">
              <Skeleton className="h-4 w-4 rounded-full bg-cosmic-800/40" />
              <Skeleton className="h-4 w-28 bg-cosmic-800/40" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(CommunityLocationsSkeleton);


import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

const CollectionsLoadingSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-[200px] w-full rounded-xl bg-cosmic-800/40" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4 bg-cosmic-800/40" />
            <Skeleton className="h-4 w-1/2 bg-cosmic-800/40" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default CollectionsLoadingSkeleton;

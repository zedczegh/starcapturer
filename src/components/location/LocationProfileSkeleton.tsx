
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const LocationProfileSkeleton = () => {
  return (
    <div className="space-y-6 p-6 animate-in fade-in-50">
      {/* Header section skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4 bg-cosmic-800/50" />
        <div className="flex gap-4">
          <Skeleton className="h-6 w-24 bg-cosmic-800/50" />
          <Skeleton className="h-6 w-24 bg-cosmic-800/50" />
        </div>
      </div>

      {/* Location info skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[200px] bg-cosmic-800/50" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full bg-cosmic-800/50" />
          <Skeleton className="h-4 w-5/6 bg-cosmic-800/50" />
          <Skeleton className="h-4 w-4/6 bg-cosmic-800/50" />
        </div>
      </div>

      {/* Features skeleton */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 bg-cosmic-800/50" />
        ))}
      </div>
    </div>
  );
};

export default LocationProfileSkeleton;

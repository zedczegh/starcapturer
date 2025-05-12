
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const MessagesSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-gradient-to-b from-cosmic-900/40 to-cosmic-950/40">
      {/* Skeleton header */}
      <div className="p-3 border-b border-cosmic-800/30 bg-cosmic-900/40 flex items-center">
        <Button variant="ghost" size="icon" className="mr-2">
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4 pt-6">
        <div className="space-y-6">
          {/* Generated message skeletons - alternating sides */}
          <div className="flex justify-start mb-6 max-w-[70%]">
            <div>
              <Skeleton className="h-16 w-44 rounded-2xl rounded-tl-none" />
              <Skeleton className="mt-1 h-3 w-16" />
            </div>
          </div>
          
          <div className="flex justify-end mb-6 max-w-[70%]">
            <div className="flex flex-col items-end">
              <Skeleton className="h-12 w-36 rounded-2xl rounded-tr-none bg-primary/30" />
              <Skeleton className="mt-1 h-3 w-14 bg-primary/20" />
            </div>
          </div>
          
          <div className="flex justify-start mb-6 max-w-[70%]">
            <div>
              <Skeleton className="h-20 w-56 rounded-2xl rounded-tl-none" />
              <Skeleton className="mt-1 h-3 w-16" />
            </div>
          </div>
          
          <div className="flex justify-end mb-6 max-w-[70%]">
            <div className="flex flex-col items-end">
              <Skeleton className="h-10 w-28 rounded-2xl rounded-tr-none bg-primary/30" />
              <Skeleton className="mt-1 h-3 w-14 bg-primary/20" />
            </div>
          </div>
          
          <div className="flex justify-start mb-6 max-w-[70%]">
            <div>
              <Skeleton className="h-14 w-48 rounded-2xl rounded-tl-none" />
              <Skeleton className="mt-1 h-3 w-16" />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default MessagesSkeleton;

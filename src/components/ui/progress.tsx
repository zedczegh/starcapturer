
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  className?: string;
  style?: React.CSSProperties;
  colorClass?: string; // For Tailwind color classes
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, style, colorClass, ...props }, ref) => {
  // Ensure value is always at least 1 for visibility
  const safeValue = value !== undefined && value !== null ? Math.max(1, value) : 1;
  
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary/40 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 transition-all duration-700 ease-out relative",
          colorClass || "bg-primary"
        )}
        style={{ 
          transform: `translateX(-${100 - (safeValue || 0)}%)`,
          backgroundColor: !colorClass && style?.backgroundColor ? style.backgroundColor : undefined
        }}
      >
        {/* Animated shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" 
             style={{ 
               animation: `shimmer 2s ease-in-out infinite`,
               backgroundSize: '200% 100%'
             }} 
        />
      </ProgressPrimitive.Indicator>
      
      {/* Add shimmer keyframes to global styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </ProgressPrimitive.Root>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }

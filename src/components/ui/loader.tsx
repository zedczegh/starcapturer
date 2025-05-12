
import * as React from "react"
import { Loader2 as Loader2Icon } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "default" | "lg"
}

const Loader2: React.FC<LoaderProps> = ({ 
  className, 
  size = "default", 
  ...props 
}) => {
  return (
    <div 
      className={cn("flex items-center justify-center", className)} 
      {...props}
    >
      <Loader2Icon 
        className={cn(
          "animate-spin text-primary", 
          size === "xs" && "h-3 w-3",
          size === "sm" && "h-4 w-4", 
          size === "default" && "h-6 w-6", 
          size === "lg" && "h-8 w-8"
        )} 
      />
    </div>
  )
}

export { Loader2 }

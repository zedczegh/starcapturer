
import * as React from "react"
import { Loader2 as Loader2Icon } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg"
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
          size === "sm" && "h-4 w-4", 
          size === "default" && "h-6 w-6", 
          size === "lg" && "h-8 w-8"
        )} 
      />
    </div>
  )
}

export { Loader2 }

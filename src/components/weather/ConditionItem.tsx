
import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConditionItemProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tooltip?: string;
  className?: string;
  badgeText?: string;
}

const ConditionItem: React.FC<ConditionItemProps> = ({
  icon,
  label,
  value,
  tooltip,
  className,
  badgeText
}) => {
  return (
    <div className={cn("flex items-start mb-2", className)}>
      <div className="mr-2 mt-0.5 text-muted-foreground/80">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center">
          <h3 className="text-xs font-medium text-muted-foreground">
            {label}
          </h3>
          
          {badgeText && (
            <span className="ml-2 px-1.5 py-0.5 text-xs rounded-sm bg-blue-500/30 text-blue-300 border border-blue-500/20">
              {badgeText}
            </span>
          )}
          
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 ml-1.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-64">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="mt-0.5 text-primary-foreground">{value}</div>
      </div>
    </div>
  );
};

export default ConditionItem;

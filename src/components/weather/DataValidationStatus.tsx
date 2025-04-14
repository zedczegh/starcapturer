
import React from "react";
import { Badge } from "@/components/ui/badge";
import { InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";

interface DataValidationStatusProps {
  isValid: boolean;
  message?: string;
  discrepancies?: string[];
}

/**
 * DataValidationStatus displays the validation status of weather or SIQS data
 * Can be toggled for debugging purposes
 */
const DataValidationStatus: React.FC<DataValidationStatusProps> = ({
  isValid,
  message,
  discrepancies
}) => {
  const { t } = useLanguage();
  
  // Hide in production, only show for debugging
  const showDebugInfo = process.env.NODE_ENV === 'development';
  
  if (!showDebugInfo) return null;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center">
            <Badge 
              variant={isValid ? "outline" : "destructive"}
              className="text-xs px-1.5"
            >
              {isValid ? "Valid" : "Invalid"}
            </Badge>
            {!isValid && discrepancies && (
              <InfoIcon className="w-3.5 h-3.5 ml-1 text-amber-400" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="max-w-xs">
          {message || (isValid 
            ? t("Data is valid and consistent", "数据有效且一致") 
            : t("Data has inconsistencies", "数据存在不一致")
          )}
          
          {discrepancies && discrepancies.length > 0 && (
            <div className="mt-1 text-xs">
              <div className="font-semibold mb-0.5">{t("Discrepancies", "差异")}:</div>
              <ul className="list-disc pl-4">
                {discrepancies.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DataValidationStatus;

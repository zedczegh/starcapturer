
import React from "react";
import { MapPin } from "lucide-react";

interface LocationHeaderMainDisplayProps {
  // Main title: should be the official/certified name
  mainName: string;
  // Subtitle: original (usually geocoded) name
  originalName?: string;
  // If true, show the original name; only shown when different from main
  showOriginalName?: boolean;
  // For responsive text sizing
  isMobile?: boolean;
}

const LocationHeaderMainDisplay = ({
  mainName,
  originalName,
  showOriginalName,
  isMobile = false
}: LocationHeaderMainDisplayProps) => {
  // Only show original name if it's different from the main name
  const shouldShowOriginal = React.useMemo(() => 
    showOriginalName && 
    originalName && 
    originalName !== mainName, 
    [showOriginalName, originalName, mainName]
  );

  // Pre-calculate classes for better performance
  const titleClassName = React.useMemo(() =>
    `font-semibold ${isMobile ? 'text-base' : 'text-lg'} line-clamp-1`,
    [isMobile]
  );

  return (
    <div>
      <h3 className={titleClassName}>{mainName}</h3>
      {shouldShowOriginal && (
        <div className="mt-1 mb-1.5 flex items-center">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
          <span className="text-xs text-muted-foreground line-clamp-1">
            {originalName}
          </span>
        </div>
      )}
    </div>
  );
};

export default React.memo(LocationHeaderMainDisplay);

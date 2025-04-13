
import React from 'react';

interface LocationNameProps {
  name: string;
  chineseName?: string;
  language: string;
  compact?: boolean;
}

const LocationName: React.FC<LocationNameProps> = ({ 
  name,
  chineseName, 
  language,
  compact = false 
}) => {
  // Determine display name based on language and availability
  const displayName = language === "zh" && chineseName 
    ? chineseName 
    : name;
    
  return (
    <h3 className={`font-medium text-cosmic-50 ${compact ? 'text-sm line-clamp-1' : 'text-base line-clamp-2'}`}>
      {displayName}
    </h3>
  );
};

export default LocationName;

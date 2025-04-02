
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getBortleScaleColor } from '@/data/utils/bortleScaleUtils';

interface BortleBadgeProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
}

const BortleBadge: React.FC<BortleBadgeProps> = ({ value, size = 'md' }) => {
  // Get color data for Bortle scale
  const colorData = getBortleScaleColor(value);
  
  // Extract colors
  const colorText = typeof colorData === 'string' ? colorData : colorData.text;
  const colorBg = typeof colorData === 'string' ? colorData : colorData.bg;
  const colorBorder = typeof colorData === 'string' ? colorData : colorData.border;
  
  // Determine size classes
  const sizeClasses = {
    sm: 'text-xs py-0 px-1.5',
    md: 'text-xs py-0.5 px-2',
    lg: 'text-sm py-1 px-2.5'
  }[size];
  
  // Format value (show decimal only if needed)
  const formattedValue = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  
  return (
    <Badge 
      className={`font-medium ${sizeClasses} ${colorBg} ${colorBorder} ${colorText}`}
    >
      B{formattedValue}
    </Badge>
  );
};

export default BortleBadge;

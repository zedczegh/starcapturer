
import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileSectionProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

const MobileSection: React.FC<MobileSectionProps> = ({ 
  children, 
  className = '', 
  padding = 'md',
  spacing = 'md'
}) => {
  const isMobile = useIsMobile();
  
  const paddingClasses = {
    none: '',
    sm: isMobile ? 'p-3' : 'p-4',
    md: isMobile ? 'p-4' : 'p-6',
    lg: isMobile ? 'p-6' : 'p-8'
  };
  
  const spacingClasses = {
    none: '',
    sm: isMobile ? 'mb-3' : 'mb-4',
    md: isMobile ? 'mb-4' : 'mb-6',
    lg: isMobile ? 'mb-6' : 'mb-8'
  };

  return (
    <div className={cn(
      'rounded-xl bg-gradient-to-br from-cosmic-900/30 to-cosmic-800/20 backdrop-blur-lg',
      'shadow-lg hover:shadow-xl transition-all duration-300',
      paddingClasses[padding],
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  );
};

export default MobileSection;

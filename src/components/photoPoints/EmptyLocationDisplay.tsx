
import React from 'react';
import { Filter, MapPin } from 'lucide-react';

interface EmptyLocationDisplayProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  activeView?: 'certified' | 'calculated';
  onRefresh?: () => void;
}

const EmptyLocationDisplay: React.FC<EmptyLocationDisplayProps> = ({
  title,
  description,
  icon,
  activeView,
  onRefresh
}) => {
  // Default texts based on the active view
  const defaultTitle = activeView === 'calculated' 
    ? 'No calculated locations found'
    : 'No certified locations in this area';
    
  const defaultDescription = activeView === 'calculated'
    ? 'Try adjusting the search radius or selecting a different location.'
    : 'There are no certified dark sky locations in this region. Try exploring the calculated view instead.';
    
  const defaultIcon = activeView === 'calculated'
    ? <MapPin className="h-12 w-12 text-muted-foreground/40" />
    : <Filter className="h-12 w-12 text-muted-foreground/40" />;

  return (
    <div className="py-12 text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="flex justify-center">
          {icon || defaultIcon}
        </div>
        <h3 className="text-lg font-medium text-muted-foreground">
          {title || defaultTitle}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {description || defaultDescription}
        </p>
        {onRefresh && (
          <button 
            onClick={onRefresh}
            className="mt-2 px-4 py-2 bg-primary/80 hover:bg-primary text-primary-foreground rounded-md text-sm transition-colors"
          >
            Refresh Data
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyLocationDisplay;


import React from 'react';
import { Filter, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyLocationDisplayProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  onAction?: () => void;
  actionLabel?: string;
}

const EmptyLocationDisplay: React.FC<EmptyLocationDisplayProps> = ({
  title,
  description,
  icon = <Filter className="h-12 w-12 text-muted-foreground/40" />,
  onAction,
  actionLabel
}) => {
  return (
    <div className="py-12 text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="flex justify-center bg-muted/30 rounded-full p-4">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-muted-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground/80 max-w-md mx-auto">
          {description}
        </p>
        
        {onAction && actionLabel && (
          <Button 
            variant="outline"
            onClick={onAction}
            className="mt-4"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyLocationDisplay;

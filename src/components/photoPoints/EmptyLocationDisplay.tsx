
import React from 'react';
import { Filter } from 'lucide-react';

interface EmptyLocationDisplayProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  viewType?: 'certified' | 'calculated';
}

const EmptyLocationDisplay: React.FC<EmptyLocationDisplayProps> = ({
  title,
  description,
  icon = <Filter className="h-12 w-12 text-muted-foreground/40" />,
  isLoading = false,
  viewType = 'calculated'
}) => {
  return (
    <div className="py-12 text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="flex justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-muted-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {description}
        </p>
      </div>
    </div>
  );
};

export default EmptyLocationDisplay;
